import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { boardOwner, db, ok, ToolError } from "../lib.js";

const KeywordInput = z.object({
  keyword: z.string().min(1),
  volume: z.number().int().nullable().optional(),
  kd: z.number().nullable().optional(),
  cpc: z.number().nullable().optional(),
  traffic_potential: z.number().int().nullable().optional(),
  parent_topic: z.string().nullable().optional(),
  intent: z.string().nullable().optional(),
  country: z.string().default("us").optional()
});

const keyOf = (k: string, c?: string | null) =>
  `${k.trim().toLowerCase()}|${(c || "us").toLowerCase()}`;

export function registerKeywordTools(server: McpServer) {
  server.registerTool(
    "keyword_list",
    {
      title: "List keywords",
      description:
        "Read the keywords on a board. Filter to just the selected ones, or search by " +
        "substring. Returns metrics so you can rank or summarise them.",
      inputSchema: {
        board_id: z.string(),
        selected_only: z.boolean().default(false).optional(),
        contains: z.string().optional().describe("Case-insensitive substring filter"),
        limit: z.number().int().min(1).max(1000).default(200).optional()
      },
      outputSchema: { count: z.number(), keywords: z.array(z.any()) },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
    },
    async ({ board_id, selected_only, contains, limit }) => {
      let q = db()
        .from("keywords")
        .select("id,keyword,selected,volume,kd,cpc,traffic_potential,parent_topic,intent,country,source")
        .eq("board_id", board_id)
        .order("volume", { ascending: false, nullsFirst: false })
        .limit(limit ?? 200);
      if (selected_only) q = q.eq("selected", true);
      if (contains) q = q.ilike("keyword", `%${contains}%`);

      const { data, error } = await q;
      if (error) {
        throw new ToolError(
          `Could not read keywords: ${error.message}. If the table is missing, run ` +
            `supabase-keywords.sql in the Supabase SQL editor.`
        );
      }
      return ok({ count: (data || []).length, keywords: data || [] });
    }
  );

  server.registerTool(
    "keyword_upsert",
    {
      title: "Add or update keywords",
      description:
        "Write a batch of keywords onto a board. Keywords already present (same text and " +
        "country, case-insensitive) are updated rather than duplicated, so re-running an " +
        "Ahrefs export is safe. Returns how many were added and how many updated.",
      inputSchema: {
        board_id: z.string(),
        keywords: z.array(KeywordInput).min(1).max(500),
        source: z.string().optional().describe("Where these came from, e.g. 'ahrefs-2026-09'")
      },
      outputSchema: { added: z.number(), updated: z.number(), skipped: z.number() },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true }
    },
    async ({ board_id, keywords, source }) => {
      /* collapse repeats inside the batch first, or the unique index rejects it */
      const unique = new Map<string, z.infer<typeof KeywordInput>>();
      for (const k of keywords) unique.set(keyOf(k.keyword, k.country), k);

      const { data: existing, error: readErr } = await db()
        .from("keywords")
        .select("id,keyword,country")
        .eq("board_id", board_id)
        .limit(5000);
      if (readErr) throw new ToolError(`Could not read existing keywords: ${readErr.message}`);

      const byKey = new Map<string, string>();
      for (const r of existing || []) byKey.set(keyOf(r.keyword, r.country), r.id);

      const owner = await boardOwner(board_id);
      const inserts: Record<string, unknown>[] = [];
      const updates: { id: string; patch: Record<string, unknown> }[] = [];

      for (const [key, k] of unique) {
        const patch = {
          keyword: k.keyword,
          volume: k.volume ?? null,
          kd: k.kd ?? null,
          cpc: k.cpc ?? null,
          traffic_potential: k.traffic_potential ?? null,
          parent_topic: k.parent_topic ?? null,
          intent: k.intent ?? null,
          country: (k.country || "us").toLowerCase(),
          source: source ?? "mcp"
        };
        const id = byKey.get(key);
        if (id) updates.push({ id, patch });
        else inserts.push({ owner_id: owner, board_id, ...patch });
      }

      let added = 0;
      if (inserts.length) {
        const { error } = await db().from("keywords").insert(inserts);
        if (error) throw new ToolError(`Insert failed: ${error.message}`);
        added = inserts.length;
      }
      let updated = 0;
      for (const u of updates) {
        const { error } = await db().from("keywords").update(u.patch).eq("id", u.id);
        if (!error) updated++;
      }
      return ok({ added, updated, skipped: keywords.length - unique.size });
    }
  );

  server.registerTool(
    "keyword_set_selected",
    {
      title: "Select or deselect keywords",
      description:
        "Move keywords between the repo and the selected list. Selected keywords appear " +
        "in the upper table of the Keyword Repo tab.",
      inputSchema: {
        board_id: z.string(),
        keywords: z.array(z.string()).min(1).describe("Keyword text, matched case-insensitively"),
        selected: z.boolean()
      },
      outputSchema: { changed: z.number(), not_found: z.array(z.string()) },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true }
    },
    async ({ board_id, keywords, selected }) => {
      const { data, error } = await db()
        .from("keywords")
        .select("id,keyword")
        .eq("board_id", board_id)
        .limit(5000);
      if (error) throw new ToolError(`Could not read keywords: ${error.message}`);

      const want = new Set(keywords.map((k) => k.trim().toLowerCase()));
      const hits = (data || []).filter((r: any) => want.has(String(r.keyword).toLowerCase()));
      const found = new Set(hits.map((r: any) => String(r.keyword).toLowerCase()));

      let changed = 0;
      for (const h of hits) {
        const { error: e } = await db().from("keywords").update({ selected }).eq("id", h.id);
        if (!e) changed++;
      }
      return ok({
        changed,
        not_found: keywords.filter((k) => !found.has(k.trim().toLowerCase()))
      });
    }
  );

  server.registerTool(
    "keyword_delete",
    {
      title: "Delete keywords",
      description: "Permanently remove keywords from a board. This cannot be undone.",
      inputSchema: {
        board_id: z.string(),
        keywords: z.array(z.string()).min(1)
      },
      outputSchema: { deleted: z.number() },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true }
    },
    async ({ board_id, keywords }) => {
      const { data, error } = await db()
        .from("keywords")
        .select("id,keyword")
        .eq("board_id", board_id)
        .limit(5000);
      if (error) throw new ToolError(`Could not read keywords: ${error.message}`);
      const want = new Set(keywords.map((k) => k.trim().toLowerCase()));
      const ids = (data || []).filter((r: any) => want.has(String(r.keyword).toLowerCase())).map((r: any) => r.id);
      if (!ids.length) return ok({ deleted: 0 });
      const { error: delErr } = await db().from("keywords").delete().in("id", ids);
      if (delErr) throw new ToolError(`Delete failed: ${delErr.message}`);
      return ok({ deleted: ids.length });
    }
  );
}
