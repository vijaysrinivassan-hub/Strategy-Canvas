import { z } from "zod";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { boardOwner, BUCKET, db, loadBoard, ok, saveBoard, ToolError } from "../lib.js";

const folder = async (boardId: string) => `${await boardOwner(boardId)}/${boardId}`;
const display = (n: string) => n.replace(/^\d{13}-/, "");

/** Text-ish files can be handed back inline; binaries cannot. */
const TEXTUAL = /\.(txt|md|csv|tsv|json|xml|ya?ml|html?|js|ts|css|sql)$/i;

export function registerDocumentTools(server: McpServer) {
  server.registerTool(
    "document_list",
    {
      title: "List documents",
      description:
        "List the files attached to a board, with the column each is filed under in the " +
        "Document Gallery, its size and when it was uploaded.",
      inputSchema: { board_id: z.string() },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
    },
    async ({ board_id }) => {
      const { body } = await loadBoard(board_id);
      const gallery = body.tabs["Document Gallery"] || {};
      const columns: any[] = gallery.columns || [];
      const meta: Record<string, any> = gallery.files || {};

      const { data, error } = await db()
        .storage.from(BUCKET)
        .list(await folder(board_id), { limit: 500, sortBy: { column: "created_at", order: "desc" } });
      if (error) {
        throw new ToolError(
          `Could not list documents: ${error.message}. If the bucket is missing, run ` +
            `supabase-storage.sql in the Supabase SQL editor.`
        );
      }

      const files = (data || []).filter((f: any) => f.id);
      const documents = files.map((f: any) => {
        const m = meta[f.name] || {};
        const col = columns.find((c) => c.id === m.col);
        return {
          storage_name: f.name,
          name: m.title || display(f.name),
          column: col ? col.name : columns[0]?.name ?? null,
          size_bytes: f.metadata?.size ?? null,
          uploaded_at: f.created_at ?? null
        };
      });
      return ok({ count: documents.length, columns: columns.map((c) => c.name), documents });
    }
  );

  server.registerTool(
    "document_read",
    {
      title: "Read a document",
      description:
        "Return the contents of a text-based document (txt, md, csv, json, sql and the " +
        "like). For binaries such as PDF or xlsx use document_link instead, which gives " +
        "a temporary download URL.",
      inputSchema: {
        board_id: z.string(),
        storage_name: z.string().describe("storage_name from document_list"),
        max_chars: z.number().int().min(100).max(200000).default(50000).optional()
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
    },
    async ({ board_id, storage_name, max_chars }) => {
      if (!TEXTUAL.test(storage_name)) {
        throw new ToolError(
          `${display(storage_name)} is not a text file, so it cannot be read inline. ` +
            `Use document_link to get a download URL for it.`
        );
      }
      const { data, error } = await db().storage.from(BUCKET).download(`${await folder(board_id)}/${storage_name}`);
      if (error) throw new ToolError(`Could not download that file: ${error.message}`);
      const full = await data.text();
      const cap = max_chars ?? 50000;
      return ok({
        name: display(storage_name),
        truncated: full.length > cap,
        text: full.slice(0, cap)
      });
    }
  );

  server.registerTool(
    "document_link",
    {
      title: "Get a document link",
      description:
        "Create a temporary signed URL for a document, valid for a few minutes. Use this " +
        "for PDFs, spreadsheets and images, which cannot be read as text.",
      inputSchema: {
        board_id: z.string(),
        storage_name: z.string(),
        expires_seconds: z.number().int().min(60).max(3600).default(600).optional()
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false }
    },
    async ({ board_id, storage_name, expires_seconds }) => {
      const ttl = expires_seconds ?? 600;
      const { data, error } = await db()
        .storage.from(BUCKET)
        .createSignedUrl(`${await folder(board_id)}/${storage_name}`, ttl);
      if (error) throw new ToolError(`Could not sign that file: ${error.message}`);
      return ok({ name: display(storage_name), url: data.signedUrl, expires_seconds: ttl });
    }
  );

  server.registerTool(
    "document_upload",
    {
      title: "Upload a document",
      description:
        "Upload a local file to a board's Document Gallery and file it under a column. " +
        "Give the column by name; it must already exist on that board.",
      inputSchema: {
        board_id: z.string(),
        file_path: z.string().describe("Absolute path to a file on this machine"),
        column: z.string().optional().describe("Column name; defaults to the first column"),
        name: z.string().optional().describe("Display name; defaults to the file name")
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false }
    },
    async ({ board_id, file_path, column, name }) => {
      let bytes: Buffer;
      try {
        bytes = await readFile(file_path);
      } catch (e: any) {
        throw new ToolError(`Could not read ${file_path}: ${e.message}`);
      }
      if (bytes.byteLength > 26214400) {
        throw new ToolError(`${basename(file_path)} is over the 25 MB limit for this bucket.`);
      }

      const { body } = await loadBoard(board_id);
      const gallery = body.tabs["Document Gallery"] || (body.tabs["Document Gallery"] = { nodes: [], edges: [] });
      if (!Array.isArray(gallery.columns) || !gallery.columns.length) {
        throw new ToolError(
          `That board has no Document Gallery columns yet. Open the board's Document ` +
            `Gallery tab once so the default columns are created, then retry.`
        );
      }
      const target = column
        ? gallery.columns.find((c: any) => c.name.toLowerCase() === column.toLowerCase())
        : gallery.columns[0];
      if (!target) {
        throw new ToolError(
          `No column called "${column}". Columns on this board: ` +
            gallery.columns.map((c: any) => c.name).join(", ")
        );
      }

      const safe = basename(file_path).replace(/[^\w.\- ]+/g, "_");
      const storageName = `${Date.now()}-${safe}`;
      const { error } = await db()
        .storage.from(BUCKET)
        .upload(`${await folder(board_id)}/${storageName}`, bytes, { upsert: false });
      if (error) throw new ToolError(`Upload failed: ${error.message}`);

      if (!gallery.files || typeof gallery.files !== "object") gallery.files = {};
      gallery.files[storageName] = { col: target.id, title: name || basename(file_path) };
      await saveBoard(board_id, body);

      return ok({ storage_name: storageName, name: name || basename(file_path), column: target.name });
    }
  );
}
