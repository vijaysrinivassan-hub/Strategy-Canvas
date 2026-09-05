import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CONTENT_VIEWS, loadBoard, ok, saveBoard, tabSlot, ToolError, uid } from "../lib.js";

const CONTENT_TAB = "Content Strategy";

/** A table cell used to be a bare string. It now carries the words, whether the
 *  piece is aimed at answer engines or search engines, and what kind of article
 *  it becomes — all three follow the keyword, not the row. Old strings still
 *  read correctly. */
function readCell(raw: any): { value: string; mode: "aeo" | "seo"; type: string; on: boolean } {
  if (typeof raw === "string") return { value: raw, mode: "aeo", type: "", on: false };
  if (raw && typeof raw === "object") {
    return {
      value: raw.v || "",
      mode: raw.mode === "seo" ? "seo" : "aeo",
      type: raw.type || "",
      on: !!raw.on
    };
  }
  return { value: "", mode: "aeo", type: "", on: false };
}

/** Resolve an article-kind name (Listicle, Informational...) to its id. */
function kindIdFor(root: any, name: string | undefined): string {
  if (!name) return "";
  const types = articleTypes(root);
  const hit = types.find((t) => String(t.name).toLowerCase() === name.toLowerCase());
  if (!hit) {
    throw new ToolError(
      `No article type called "${name}" on this board. It offers: ` +
        (types.length ? types.map((t) => t.name).join(", ") : "(none yet)") +
        `. Add one under Settings > Article Types in the app.`
    );
  }
  return hit.id;
}

/** The article types this board offers, as the app seeds them. */
function articleTypes(root: any): { id: string; name: string }[] {
  return Array.isArray(root?.articleTypes) ? root.articleTypes : [];
}

function viewOf(body: any, view: string) {
  const slot = tabSlot(body, CONTENT_TAB);
  if (!slot.views || typeof slot.views !== "object") {
    throw new ToolError(
      `That board's Content Strategy tab has not been opened yet, so its views do not ` +
        `exist. Open the tab once in the app, then retry.`
    );
  }
  const v = slot.views[view];
  if (!v) {
    throw new ToolError(`No "${view}" view on that board. Views are: ${CONTENT_VIEWS.join(", ")}.`);
  }
  return v;
}

export function registerContentTools(server: McpServer) {
  server.registerTool(
    "content_get",
    {
      title: "Read a content view",
      description:
        "Read one of the four Content Strategy views. 'competitor' is a matrix of rows by " +
        "article type, where each cell records whether you are writing that article and " +
        "whether it targets AEO or SEO. 'category', 'icp' and 'value' are plain tables.",
      inputSchema: {
        board_id: z.string(),
        view: z.enum(CONTENT_VIEWS)
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
    },
    async ({ board_id, view }) => {
      const { body } = await loadBoard(board_id);
      const v = viewOf(body, view);

      if (v.kind === "grid") {
        const cols = (v.columns || []).map((c: any) => ({ id: c.id, name: c.name }));
        const types = articleTypes(body.tabs[CONTENT_TAB]);
        const typeName = (id: string) => types.find((t) => t.id === id)?.name ?? null;

        const rows = (v.rows || [])
          .map((r: any, i: number) => {
            const cells: Record<string, any> = {};
            for (const c of cols) {
              const cell = readCell(r.cells?.[c.id]);
              if (!cell.value && !cell.type && !cell.on) continue;
              cells[c.name] = {
                value: cell.value,
                planned: cell.on,
                mode: cell.mode,
                article_type: cell.type ? typeName(cell.type) : null
              };
            }
            return { row: i + 1, cells };
          })
          .filter((r: any) => Object.keys(r.cells).length);

        return ok({
          view,
          kind: "grid",
          data: {
            columns: cols.map((c: any) => c.name),
            article_types: types.map((t) => t.name),
            rows
          }
        });
      }

      const types = (v.types || []).filter((t: any) => (t.name || "").trim());
      const rows = (v.rows || []).filter((r: any) => (r.name || "").trim());
      const kinds = articleTypes(body.tabs[CONTENT_TAB]);
      const kindName = (id: string) => kinds.find((k) => k.id === id)?.name ?? null;
      const cells: any[] = [];
      for (const r of rows) {
        for (const t of types) {
          const raw = v.cells?.[`${r.id}|${t.id}`];
          if (!raw) continue;
          const on = raw === true || !!raw.on;
          const mode = raw === true ? "aeo" : raw.mode === "seo" ? "seo" : "aeo";
          const kind = raw === true ? null : raw.type ? kindName(raw.type) : null;
          if (on) cells.push({ row: r.name, article_type: t.name, mode, article_kind: kind });
        }
      }
      return ok({
        view,
        kind: "matrix",
        data: {
          rows: rows.map((r: any) => r.name),
          article_types: types.map((t: any) => t.name),
          planned: cells
        }
      });
    }
  );

  server.registerTool(
    "content_set_rows",
    {
      title: "Write rows into a content table",
      description:
        "Fill rows of the category, icp or value table. Give each row as an object keyed " +
        "by column name. Every cell carries its own AEO/SEO choice and article type; mode " +
        "and article_type here apply to each cell this call writes. Rows are written from " +
        "the first blank row down; pass replace to clear the table first. Not for the " +
        "competitor matrix, which uses content_plan_article.",
      inputSchema: {
        board_id: z.string(),
        view: z.enum(["category", "icp", "value"]),
        rows: z
          .array(z.record(z.string(), z.string()))
          .min(1)
          .max(200)
          .describe('e.g. [{"Category name":"Attribution","Category synonyms":"MTA"}]'),
        mode: z.enum(["aeo", "seo"]).default("aeo").optional(),
        article_type: z
          .string()
          .optional()
          .describe("Article type name; content_get lists the ones this board offers"),
        planned: z
          .boolean()
          .optional()
          .describe("Tick the cells this call writes as articles being produced"),
        replace: z.boolean().default(false).optional()
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false }
    },
    async ({ board_id, view, rows, mode, article_type, planned, replace }) => {
      const { body } = await loadBoard(board_id);
      const v = viewOf(body, view);
      if (v.kind !== "grid") throw new ToolError(`The "${view}" view is a matrix, not a table.`);

      const byName = new Map<string, string>();
      for (const c of v.columns || []) byName.set(String(c.name).toLowerCase(), c.id);

      const typeId = kindIdFor(body.tabs[CONTENT_TAB], article_type);

      const unknown = new Set<string>();
      if (replace) v.rows = [];

      let written = 0;
      for (const r of rows) {
        let slot = (v.rows || []).find((x: any) => !Object.keys(x.cells || {}).length);
        if (!slot) {
          slot = { id: uid(), cells: {} };
          v.rows.push(slot);
        }
        delete slot.mode; /* the row no longer carries one; each cell does */
        for (const [k, val] of Object.entries(r)) {
          const id = byName.get(k.toLowerCase());
          if (!id) { unknown.add(k); continue; }
          slot.cells[id] = { v: val, mode: mode ?? "aeo", type: typeId, on: !!planned };
        }
        written++;
      }
      /* keep the table standing at twenty rows */
      while (v.rows.length < 20) v.rows.push({ id: uid(), cells: {} });

      await saveBoard(board_id, body);
      return ok({ written, unknown_columns: [...unknown] });
    }
  );

  server.registerTool(
    "content_plan_article",
    {
      title: "Plan an article in the competitor matrix",
      description:
        "Tick a cell of the competitor matrix, marking that article as one you are writing, " +
        "and set whether it targets AEO or SEO and what kind of piece it is. Creates the " +
        "competitor row or article-type column if either is missing.",
      inputSchema: {
        board_id: z.string(),
        competitor: z.string(),
        article_type: z.string().describe("The column: e.g. Alternatives, Pricing, Reviews, Features"),
        mode: z.enum(["aeo", "seo"]).default("aeo").optional(),
        article_kind: z
          .string()
          .optional()
          .describe("The kind of piece, from Settings > Article Types: e.g. Listicle, Informational"),
        planned: z.boolean().default(true).optional()
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true }
    },
    async ({ board_id, competitor, article_type, mode, article_kind, planned }) => {
      const { body } = await loadBoard(board_id);
      const v = viewOf(body, "competitor");
      const kindId = kindIdFor(body.tabs[CONTENT_TAB], article_kind);

      const findOrFill = (list: any[], name: string, make: () => any) => {
        let hit = list.find((x: any) => String(x.name || "").toLowerCase() === name.toLowerCase());
        if (hit) return hit;
        hit = list.find((x: any) => !String(x.name || "").trim()); /* reuse a blank slot */
        if (hit) { Object.assign(hit, make()); return hit; }
        const fresh = make();
        list.push(fresh);
        return fresh;
      };

      const row = findOrFill(v.rows, competitor, () => ({ id: uid(), name: competitor, aliases: [] }));
      if (!row.name) row.name = competitor;
      const type = findOrFill(v.types, article_type, () => ({
        id: uid(),
        name: article_type,
        terms: [article_type.toLowerCase()]
      }));
      if (!type.name) { type.name = article_type; type.terms = [article_type.toLowerCase()]; }

      const key = `${row.id}|${type.id}`;
      const on = planned ?? true;
      const m = mode ?? "aeo";
      /* keep a kind the cell already had unless a new one was given */
      const prev = v.cells[key];
      const kept = prev && typeof prev === "object" ? prev.type || "" : "";
      const type_ = kindId || kept;
      if (!on && m === "aeo" && !type_) delete v.cells[key];
      else v.cells[key] = { on, mode: m, type: type_ };

      await saveBoard(board_id, body);
      return ok({
        competitor: row.name,
        article_type: type.name,
        mode: m,
        article_kind: article_kind ?? null,
        planned: on
      });
    }
  );

  server.registerTool(
    "channel_set",
    {
      title: "Set channel scope",
      description:
        "Turn a channel on or off in the Channel Strategy tab, which is what tells a client " +
        "what is in scope. Creates the channel if it is not already listed.",
      inputSchema: {
        board_id: z.string(),
        channel: z.string().describe("e.g. Technical SEO"),
        in_scope: z.boolean()
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true }
    },
    async ({ board_id, channel, in_scope }) => {
      const { body } = await loadBoard(board_id);
      const slot = tabSlot(body, "Channel Strategy");
      if (!Array.isArray(slot.items)) slot.items = [];
      let item = slot.items.find((i: any) => String(i.name).toLowerCase() === channel.toLowerCase());
      if (!item) {
        item = { id: uid(), name: channel, on: in_scope };
        slot.items.push(item);
      } else {
        item.on = in_scope;
      }
      await saveBoard(board_id, body);
      return ok({ channel: item.name, in_scope: item.on });
    }
  );
}
