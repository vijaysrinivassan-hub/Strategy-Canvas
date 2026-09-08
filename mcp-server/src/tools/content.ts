import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CONTENT_VIEWS, loadBoard, ok, saveBoard, tabSlot, ToolError, uid } from "../lib.js";

const CONTENT_TAB = "Content Strategy";

/** A table cell used to be a bare string. It now carries the words, whether the
 *  piece is aimed at answer engines or search engines, and what kind of article
 *  it becomes — all three follow the keyword, not the row. Old strings still
 *  read correctly. */
const AWARENESS = ["Problem aware", "Solution aware", "Feature aware", "Competitor aware"] as const;
/** Where an article stands. The app stores the short id. */
const STATUS = ["written", "review", "progress", "planned"] as const;
const STATUS_LABEL: Record<string, string> = {
  written: "Already written", review: "Sent for review", progress: "In progress", planned: "Planned"
};

function readCell(raw: any): {
  value: string; mode: "aeo" | "seo"; type: string; on: boolean; aw: string; st: string;
} {
  if (typeof raw === "string") return { value: raw, mode: "aeo", type: "", on: false, aw: "", st: "" };
  if (raw && typeof raw === "object") {
    return {
      value: raw.v || "",
      mode: raw.mode === "seo" ? "seo" : "aeo",
      type: raw.type || "",
      on: !!raw.on,
      aw: raw.aw || "",
      st: raw.st || ""
    };
  }
  return { value: "", mode: "aeo", type: "", on: false, aw: "", st: "" };
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
              if (!cell.value && !cell.type && !cell.on && !cell.aw && !cell.st) continue;
              cells[c.name] = {
                value: cell.value,
                planned: cell.on,
                status: cell.st ? STATUS_LABEL[cell.st] ?? cell.st : null,
                mode: cell.mode,
                article_type: cell.type ? typeName(cell.type) : null,
                awareness: cell.aw || null
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
          const cell = readCell(raw);
          if (cell.on || cell.value || cell.aw || cell.st) {
            cells.push({
              row: r.name,
              article_type: t.name,
              planned: cell.on,
              status: cell.st ? STATUS_LABEL[cell.st] ?? cell.st : null,
              text: cell.value || null,
              mode: cell.mode,
              article_kind: cell.type ? kindName(cell.type) : null,
              awareness: cell.aw || null
            });
          }
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
    "content_set_columns",
    {
      title: "Set a table's columns",
      description:
        "Set the columns of the category, icp or value table. Give the whole list, in the " +
        "order you want them. A name that already exists keeps its column and everything " +
        "in it; a new name is added empty; any column you leave out is removed along with " +
        "its cells. To rename a column and keep its contents, give that entry as " +
        '{"name":"New heading","replaces":"Old heading"} rather than a bare string. Ten ' +
        "columns is the limit. Use this before content_set_rows when the table's headings " +
        "do not suit what you are filling it with.",
      inputSchema: {
        board_id: z.string(),
        view: z.enum(["category", "icp", "value"]),
        columns: z
          .array(
            z.union([
              z.string().min(1),
              z.object({
                name: z.string().min(1),
                replaces: z
                  .string()
                  .optional()
                  .describe("Existing column whose contents move to this one")
              })
            ])
          )
          .min(1)
          .max(10)
          .describe('The full list, in order, e.g. ["Slug","Category","Article type","URL"]')
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true }
    },
    async ({ board_id, view, columns }) => {
      const { body } = await loadBoard(board_id);
      const v = viewOf(body, view);
      if (v.kind !== "grid") throw new ToolError(`The "${view}" view is a matrix, not a table.`);

      const want = columns
        .map((c) => (typeof c === "string" ? { name: c.trim(), replaces: undefined } : {
          name: c.name.trim(), replaces: c.replaces?.trim() || undefined
        }))
        .filter((c) => c.name);

      const seen = new Set<string>();
      for (const c of want) {
        const k = c.name.toLowerCase();
        if (seen.has(k)) throw new ToolError(`"${c.name}" is listed twice; column names must differ.`);
        seen.add(k);
      }

      const before: any[] = v.columns || [];
      const find = (name: string) =>
        before.find((c: any) => String(c.name).toLowerCase() === name.toLowerCase());
      const claimed = new Set<string>();
      const kept: any[] = [];
      for (const c of want) {
        /* an explicit rename carries the old column's cells over; otherwise a
           column is only the same column when its name has not changed */
        let match = c.replaces ? find(c.replaces) : find(c.name);
        if (c.replaces && !match) {
          throw new ToolError(
            `No column called "${c.replaces}" to rename. Columns are: ` +
              before.map((x: any) => x.name).join(", ") + "."
          );
        }
        if (match && claimed.has(match.id)) match = undefined;   // already spoken for
        if (match) { claimed.add(match.id); kept.push({ id: match.id, name: c.name }); }
        else kept.push({ id: uid(), name: c.name });
      }

      /* cells belonging to a column that has gone go with it */
      const live = new Set(kept.map((c) => c.id));
      let dropped = 0;
      for (const r of v.rows || []) {
        for (const key of Object.keys(r.cells || {})) {
          if (!live.has(key)) { delete r.cells[key]; dropped++; }
        }
      }
      v.columns = kept;
      await saveBoard(board_id, body);

      return ok({
        view,
        columns: kept.map((c) => c.name),
        removed: before
          .filter((c: any) => !live.has(c.id))
          .map((c: any) => c.name),
        cells_discarded: dropped
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
        awareness: z
          .enum(AWARENESS)
          .optional()
          .describe("Reader's awareness level for the cells this call writes"),
        status: z
          .enum(STATUS)
          .optional()
          .describe("Where the article stands: written, review, progress or planned"),
        apply_to: z
          .string()
          .optional()
          .describe(
            "Column that carries the article: only its cell gets the mode, article type, " +
              "awareness, status and tick, and the other columns are written as plain text. " +
              "Omit to apply them to every cell in the row."
          ),
        replace: z.boolean().default(false).optional()
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false }
    },
    async ({ board_id, view, rows, mode, article_type, planned, awareness, status, apply_to, replace }) => {
      const { body } = await loadBoard(board_id);
      const v = viewOf(body, view);
      if (v.kind !== "grid") throw new ToolError(`The "${view}" view is a matrix, not a table.`);

      const byName = new Map<string, string>();
      for (const c of v.columns || []) byName.set(String(c.name).toLowerCase(), c.id);

      const typeId = kindIdFor(body.tabs[CONTENT_TAB], article_type);

      let applyId: string | null = null;
      if (apply_to) {
        const id = byName.get(apply_to.trim().toLowerCase());
        if (!id) {
          throw new ToolError(
            `No column called "${apply_to}" on the ${view} table. Columns are: ` +
              (v.columns || []).map((c: any) => c.name).join(", ") + "."
          );
        }
        applyId = id;
      }

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
          /* a cell that is only holding a label carries no article furniture */
          slot.cells[id] = applyId && id !== applyId
            ? { v: val, mode: "aeo", type: "", on: false, aw: "", st: "" }
            : {
                v: val, mode: mode ?? "aeo", type: typeId, on: !!planned,
                aw: awareness ?? "", st: status ?? ""
              };
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
        awareness: z.enum(AWARENESS).optional().describe("Reader's awareness level"),
        status: z.enum(STATUS).optional().describe("written, review, progress or planned"),
        text: z.string().optional().describe("The article's own words: its title or keyword"),
        planned: z.boolean().default(true).optional()
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true }
    },
    async ({ board_id, competitor, article_type, mode, article_kind, awareness, status, text, planned }) => {
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
      /* keep whatever the cell already had unless a new value was given */
      const prev = readCell(v.cells[key]);
      const type_ = kindId || prev.type;
      const aw = awareness ?? prev.aw;
      const st = status ?? prev.st;
      const words = text ?? prev.value;
      if (!on && m === "aeo" && !type_ && !aw && !words && !st) delete v.cells[key];
      else v.cells[key] = { on, mode: m, type: type_, v: words, aw, st };

      await saveBoard(board_id, body);
      return ok({
        competitor: row.name,
        article_type: type.name,
        text: words || null,
        mode: m,
        article_kind: article_kind ?? null,
        awareness: aw || null,
        status: st ? STATUS_LABEL[st] ?? st : null,
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
