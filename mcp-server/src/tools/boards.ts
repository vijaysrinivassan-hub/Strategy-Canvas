import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { db, loadBoard, ok, OWNER_ID, TABS, ToolError } from "../lib.js";

export function registerBoardTools(server: McpServer) {
  server.registerTool(
    "board_list",
    {
      title: "List boards",
      description:
        "List every Strategy Board, newest first. Each board belongs to one client and " +
        "holds all nine tabs. Start here to find the board_id other tools need.",
      inputSchema: {},
      outputSchema: {
        boards: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            client: z.string().optional(),
            updated_at: z.string().optional()
          })
        )
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
    },
    async () => {
      const { data, error } = await db()
        .from("reports")
        .select("id,title,body,updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw new ToolError(`Could not list boards: ${error.message}`);

      const boards = (data || []).map((r: any) => {
        let client: string | undefined;
        try {
          client = JSON.parse(r.body || "{}").client;
        } catch {
          /* a board with unreadable JSON still deserves to be listed */
        }
        return { id: r.id, title: r.title, client, updated_at: r.updated_at };
      });
      return ok({ boards });
    }
  );

  server.registerTool(
    "board_get",
    {
      title: "Get a board",
      description:
        "Read one board: its client name and a summary of what each tab holds. Use this " +
        "before writing, to see what is already there.",
      inputSchema: {
        board_id: z.string().describe("Board uuid from board_list")
      },
      outputSchema: {
        id: z.string(),
        title: z.string(),
        client: z.string().optional(),
        tabs: z.record(z.string(), z.any())
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
    },
    async ({ board_id }) => {
      const { row, body } = await loadBoard(board_id);
      const summary: Record<string, unknown> = {};
      for (const tab of TABS) {
        const slot = body.tabs[tab];
        if (!slot) { summary[tab] = { empty: true }; continue; }
        if (tab === "Content Strategy") {
          const views = slot.views || {};
          summary[tab] = Object.fromEntries(
            Object.keys(views).map((k) => [
              k,
              {
                kind: views[k].kind,
                rows: (views[k].rows || []).filter((r: any) => (r.name || "").trim() || Object.keys(r.cells || {}).length).length,
                columns: (views[k].columns || views[k].types || []).length
              }
            ])
          );
        } else if (tab === "Channel Strategy") {
          summary[tab] = { channels: (slot.items || []).map((i: any) => ({ name: i.name, on: !!i.on })) };
        } else if (tab === "Document Gallery") {
          summary[tab] = { columns: (slot.columns || []).map((c: any) => c.name) };
        } else {
          summary[tab] = {
            cards: (slot.nodes || []).filter((n: any) => n.type !== "group").length,
            groups: (slot.nodes || []).filter((n: any) => n.type === "group").length,
            connections: (slot.edges || []).length
          };
        }
      }
      return ok({ id: row.id, title: row.title, client: body.client, tabs: summary });
    }
  );

  server.registerTool(
    "board_create",
    {
      title: "Create a board",
      description:
        "Create a new client board with all nine tabs empty. Returns the new board_id.",
      inputSchema: {
        client: z.string().min(1).describe("Client name, e.g. 'Triple Whale'")
      },
      outputSchema: { id: z.string(), title: z.string() },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false }
    },
    async ({ client }) => {
      const body = { version: 1, client, logo: "", tabs: {} };
      const { data, error } = await db()
        .from("reports")
        .insert({
          owner_id: OWNER_ID(),
          title: `${client} Strategy Board`,
          body: JSON.stringify(body)
        })
        .select("id,title")
        .single();
      if (error) throw new ToolError(`Could not create the board: ${error.message}`);
      return ok({ id: data.id, title: data.title });
    }
  );
}
