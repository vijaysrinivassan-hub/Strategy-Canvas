import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { db, loadBoard, ok, ownerId, TABS, ToolError } from "../lib.js";
import { architecturePrompts } from './architecture.js';

export function registerBoardTools(server: McpServer) {
  server.registerTool(
    "board_list",
    {
      title: "List boards",
      description:
        "List every Strategy Board, newest first. Each board belongs to one client and " +
        "holds all workspace tabs. Start here to find the board_id other tools need.",
      inputSchema: {},
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
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
    },
    async ({ board_id }) => {
      const { row, body } = await loadBoard(board_id);
      const summary: Record<string, unknown> = {};
      for (const tab of TABS) {
        const slot = body.tabs[tab];
        if (!slot) { summary[tab] = { empty: true }; continue; }
        if (tab === "Strategy 1 — Brand Strategy") {
          summary[tab] = {
            opened: !!slot.guide?.opened,
            ocean: slot.guide?.ocean || null,
            channels: Array.isArray(slot.channels?.items)
              ? slot.channels.items.map((item: any) => ({
                  name: item.name, on: !!item.on, motion: item.motion || "inbound"
                }))
              : []
          };
        } else if (tab === "Strategy 1 — Positioning Document") {
          summary[tab] = {
            fields: {
              positioning_statement: slot.fields?.positioning_statement || "",
              icp_positioning: slot.fields?.icp_positioning || "",
              category_positioning: slot.fields?.category_positioning || "",
              competitive_positioning: slot.fields?.competitive_positioning || "",
              value_positioning: slot.fields?.value_positioning || ""
            }
          };
        } else if (tab === "Strategy 1 — Product Architecture") {
          const architecture = slot.architecture;
          if (!architecture) {
            summary[tab] = { empty: true };
          } else {
            const systems = Array.isArray(architecture.systems) ? architecture.systems : [];
            const nodes = Array.isArray(architecture.nodes) ? architecture.nodes : [];
            summary[tab] = {
              product: architecture.name || null,
              sample: architecture.sample || "blank",
              systems: systems.map((system: any) => ({
                name: system.name || "",
                nodes: nodes.filter((node: any) => node.systemId === system.id).length
              })),
              nodes: nodes.length,
              connections: Array.isArray(architecture.edges) ? architecture.edges.length : 0,
              groups: Array.isArray(architecture.groups)
                ? architecture.groups.map((group: any) => ({ name: group.name, nodes: group.nodeIds?.length || 0 }))
                : [],
              outputs: Array.isArray(architecture.edges)
                ? architecture.edges.map((edge: any) => edge.label).filter(Boolean)
                : []
            };
          }
        } else if (tab === "Content Strategy") {
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
        } else if (tab === "Grounded Evidences") {
          summary[tab] = { rows: (slot.sections || []).map((c: any) => c.name) };
        } else {
          summary[tab] = {
            cards: (slot.nodes || []).filter((n: any) => n.type !== "group").length,
            groups: (slot.nodes || []).filter((n: any) => n.type === "group").length,
            connections: (slot.edges || []).length
          };
        }
      }
      return ok({
        id: row.id,
        title: row.title,
        client: body.client,
        products: body.tabs['Strategy 1 — Brand Strategy']?.channels?.products || [],
        active_product_id: body.workspaceProductId || body.tabs['Strategy 1 — Brand Strategy']?.channels?.activeProductId || null,
        product_scope: 'Architecture, positioning, radar and the four Keywords views in tabs belong to the active product. Inactive product data is preserved separately.',
        ai_prompts: { product_architecture: await architecturePrompts(body), positioning_canvas: await architecturePrompts(body, 'positioning_canvas'), positioning_document: await architecturePrompts(body, 'positioning_document') },
        client_details: {
          goal: body.clientGoal || "Customer Acquisition",
          target_product: body.clientProduct || "",
          market_type: body.clientMarketType === "red" ? "Red Ocean" :
            body.clientMarketType === "blue" ? "Blue Ocean" : "Not selected",
          industry_type: body.clientType || "",
          sales_motion: body.clientSalesMotion === "plg" ? "PLG" :
            body.clientSalesMotion === "slg" ? "SLG" : "Not selected",
          icp_1: body.clientIcp1 || "New Entrants",
          icp_2: body.clientMarketType === "blue" ? "Customers from the Older Category" :
            body.clientMarketType === "red" ? "Customers from our Category" : "Select a market type"
        },
        tabs: summary
      });
    }
  );

  server.registerTool(
    "board_create",
    {
      title: "Create a board",
      description:
        "Create a new client board with all workspace tabs empty. Returns the new board_id.",
      inputSchema: {
        client: z.string().min(1).describe("Client name, e.g. 'Triple Whale'"),
        target_product: z.string().optional().describe("The specific product this GTM board targets"),
        goal: z.string().optional().describe("Primary goal; defaults to Customer Acquisition"),
        market_type: z.enum(["red", "blue"]).optional().describe("Red Ocean or Blue Ocean"),
        industry_type: z.enum(["saas", "ecommerce", "local", "services"]).optional(),
        sales_motion: z.enum(["plg", "slg"]).optional().describe("Product-led growth or sales-led growth"),
        icp_1: z.string().optional().describe("Primary ICP; defaults to New Entrants")
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false }
    },
    async ({ client, target_product, goal, market_type, industry_type, sales_motion, icp_1 }) => {
      const body = {
        version: 1,
        client,
        clientProduct: target_product?.trim() || "",
        clientGoal: goal?.trim() || "Customer Acquisition",
        clientMarketType: market_type || "",
        clientType: industry_type || "",
        clientSalesMotion: sales_motion || "",
        clientIcp1: icp_1?.trim() || "New Entrants",
        logo: "",
        tabs: {}
      };
      const { data, error } = await db()
        .from("reports")
        .insert({
          owner_id: await ownerId(),
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
