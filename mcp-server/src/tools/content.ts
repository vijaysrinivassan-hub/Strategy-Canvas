import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CONTENT_VIEWS, loadBoard, ok, saveBoard, tabSlot, ToolError, uid } from "../lib.js";

const CONTENT_TAB = "Content Strategy";

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
        const rows = (v.rows || [])
          .map((r: any, i: number) => {
            const cells: Record<string, string> = {};
            for (const c of cols) if (r.cells?.[c.id]) cells[c.name] = r.cells[c.id];
            return { row: i + 1, mode: r.mode === "seo" ? "seo" : "aeo", ...cells };
          })
          .filter((r: any) => Object.keys(r).length > 2);
        return ok({ view, kind: "grid", data: { columns: cols.map((c: any) => c.name), rows } });
      }

      const types = (v.types || []).filter((t: any) => (t.name || "").trim());
      const rows = (v.rows || []).filter((r: any) => (r.name || "").trim());
      const cells: any[] = [];
      for (const r of rows) {
        for (const t of types) {
          const raw = v.cells?.[`${r.id}|${t.id}`];
          if (!raw) continue;
          const on = raw === true || !!raw.on;
          const mode = raw === true ? "aeo" : raw.mode === "seo" ? "seo" : "aeo";
          if (on) cells.push({ row: r.name, article_type: t.name, mode });
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
        "by column name. Rows are written from the first blank row down; pass replace to " +
        "clear the table first. Not for the competitor matrix, which uses content_plan_article.",
      inputSchema: {
        board_id: z.string(),
        view: z.enum(["category", "icp", "value"]),
        rows: z
          .array(z.record(z.string(), z.string()))
          .min(1)
          .max(200)
          .describe('e.g. [{"Category name":"Attribution","Category synonyms":"MTA"}]'),
        mode: z.enum(["aeo", "seo"]).default("aeo").optional(),
        replace: z.boolean().default(false).optional()
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false }
    },
    async ({ board_id, view, rows, mode, replace }) => {
      const { body } = await loadBoard(board_id);
      const v = viewOf(body, view);
      if (v.kind !== "grid") throw new ToolError(`The "${view}" view is a matrix, not a table.`);

      const byName = new Map<string, string>();
      for (const c of v.columns || []) byName.set(String(c.name).toLowerCase(), c.id);

      const unknown = new Set<string>();
      if (replace) v.rows = [];

      let written = 0;
      for (const r of rows) {
        let slot = (v.rows || []).find((x: any) => !Object.keys(x.cells || {}).length);
        if (!slot) {
          slot = { id: uid(), cells: {} };
          v.rows.push(slot);
        }
        slot.mode = mode ?? "aeo";
        for (const [k, val] of Object.entries(r)) {
          const id = byName.get(k.toLowerCase());
          if (!id) { unknown.add(k); continue; }
          slot.cells[id] = val;
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
        "and set whether it targets AEO or SEO. Creates the competitor row or article-type " +
        "column if either is missing.",
      inputSchema: {
        board_id: z.string(),
        competitor: z.string(),
        article_type: z.string().describe("e.g. Alternatives, Pricing, Reviews, Features"),
        mode: z.enum(["aeo", "seo"]).default("aeo").optional(),
        planned: z.boolean().default(true).optional()
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true }
    },
    async ({ board_id, competitor, article_type, mode, planned }) => {
      const { body } = await loadBoard(board_id);
      const v = viewOf(body, "competitor");

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
      if (!on && m === "aeo") delete v.cells[key];
      else v.cells[key] = { on, mode: m };

      await saveBoard(board_id, body);
      return ok({ competitor: row.name, article_type: type.name, mode: m, planned: on });
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
