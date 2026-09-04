import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { assertCanvasTab, CANVAS_TABS, loadBoard, ok, saveBoard, tabSlot, ToolError, uid } from "../lib.js";

const SIDES = ["top", "right", "bottom", "left"] as const;

export function registerCanvasTools(server: McpServer) {
  server.registerTool(
    "canvas_get",
    {
      title: "Read a canvas",
      description:
        "Read the cards, groups and connections on one canvas tab. Canvas tabs are: " +
        CANVAS_TABS.join(", ") + ".",
      inputSchema: {
        board_id: z.string(),
        tab: z.enum(CANVAS_TABS)
      },
      outputSchema: { nodes: z.array(z.any()), edges: z.array(z.any()) },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
    },
    async ({ board_id, tab }) => {
      const { body } = await loadBoard(board_id);
      const slot = tabSlot(body, tab);
      return ok({ nodes: slot.nodes, edges: slot.edges });
    }
  );

  server.registerTool(
    "canvas_add_cards",
    {
      title: "Add cards to a canvas",
      description:
        "Add one or more text cards to a canvas tab. If you leave x and y out, cards are " +
        "laid out in a tidy grid to the right of whatever is already there, so you can add " +
        "several without overlapping them. Returns the new card ids for use with canvas_connect.",
      inputSchema: {
        board_id: z.string(),
        tab: z.enum(CANVAS_TABS),
        cards: z
          .array(
            z.object({
              text: z.string().describe("Card text. Newlines are kept."),
              x: z.number().optional(),
              y: z.number().optional(),
              width: z.number().min(80).default(220).optional(),
              height: z.number().min(50).default(90).optional(),
              color: z
                .enum(["1", "2", "3", "4", "5", "6"])
                .optional()
                .describe("1 red, 2 orange, 3 yellow, 4 green, 5 cyan, 6 purple")
            })
          )
          .min(1)
          .max(60)
      },
      outputSchema: { added: z.number(), ids: z.array(z.string()) },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false }
    },
    async ({ board_id, tab, cards }) => {
      assertCanvasTab(tab);
      const { body } = await loadBoard(board_id);
      const slot = tabSlot(body, tab);

      /* start to the right of everything already placed */
      let baseX = 0;
      let baseY = 0;
      if (slot.nodes.length) {
        baseX = Math.max(...slot.nodes.map((n: any) => n.x + (n.width || 0))) + 60;
        baseY = Math.min(...slot.nodes.map((n: any) => n.y));
      }

      const ids: string[] = [];
      cards.forEach((c, i) => {
        const w = c.width ?? 220;
        const h = c.height ?? 90;
        const node: any = {
          id: uid(),
          type: "text",
          x: c.x ?? baseX + (i % 3) * (w + 40),
          y: c.y ?? baseY + Math.floor(i / 3) * (h + 40),
          width: w,
          height: h,
          text: c.text
        };
        if (c.color) node.color = c.color;
        slot.nodes.push(node);
        ids.push(node.id);
      });

      await saveBoard(board_id, body);
      return ok({ added: ids.length, ids });
    }
  );

  server.registerTool(
    "canvas_connect",
    {
      title: "Connect two cards",
      description:
        "Draw a curved arrow from one card to another. Use ids returned by canvas_add_cards " +
        "or canvas_get.",
      inputSchema: {
        board_id: z.string(),
        tab: z.enum(CANVAS_TABS),
        from_id: z.string(),
        to_id: z.string(),
        from_side: z.enum(SIDES).default("right").optional(),
        to_side: z.enum(SIDES).default("left").optional()
      },
      outputSchema: { edge_id: z.string() },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false }
    },
    async ({ board_id, tab, from_id, to_id, from_side, to_side }) => {
      assertCanvasTab(tab);
      const { body } = await loadBoard(board_id);
      const slot = tabSlot(body, tab);
      const has = (id: string) => slot.nodes.some((n: any) => n.id === id);
      if (!has(from_id)) throw new ToolError(`No card ${from_id} on ${tab}. Call canvas_get to see the ids.`);
      if (!has(to_id)) throw new ToolError(`No card ${to_id} on ${tab}. Call canvas_get to see the ids.`);

      const edge = {
        id: uid(),
        fromNode: from_id,
        fromSide: from_side ?? "right",
        toNode: to_id,
        toSide: to_side ?? "left"
      };
      slot.edges.push(edge);
      await saveBoard(board_id, body);
      return ok({ edge_id: edge.id });
    }
  );

  server.registerTool(
    "canvas_add_group",
    {
      title: "Group cards on a canvas",
      description:
        "Draw a labelled group box around the given cards. Membership follows geometry, so " +
        "any card whose centre sits inside the box belongs to it and moves with it.",
      inputSchema: {
        board_id: z.string(),
        tab: z.enum(CANVAS_TABS),
        label: z.string(),
        card_ids: z.array(z.string()).min(1)
      },
      outputSchema: { group_id: z.string(), contains: z.number() },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false }
    },
    async ({ board_id, tab, label, card_ids }) => {
      assertCanvasTab(tab);
      const { body } = await loadBoard(board_id);
      const slot = tabSlot(body, tab);
      const members = slot.nodes.filter((n: any) => card_ids.includes(n.id));
      if (!members.length) throw new ToolError(`None of those card ids are on ${tab}.`);

      const pad = 36;
      const x0 = Math.min(...members.map((n: any) => n.x)) - pad;
      const y0 = Math.min(...members.map((n: any) => n.y)) - pad;
      const x1 = Math.max(...members.map((n: any) => n.x + n.width)) + pad;
      const y1 = Math.max(...members.map((n: any) => n.y + n.height)) + pad;

      const group = {
        id: uid(),
        type: "group",
        label,
        x: Math.round(x0),
        y: Math.round(y0),
        width: Math.round(x1 - x0),
        height: Math.round(y1 - y0)
      };
      slot.nodes.unshift(group);
      await saveBoard(board_id, body);
      return ok({ group_id: group.id, contains: members.length });
    }
  );

  server.registerTool(
    "canvas_clear",
    {
      title: "Clear a canvas",
      description:
        "Remove every card, group and connection from one canvas tab. This cannot be undone.",
      inputSchema: {
        board_id: z.string(),
        tab: z.enum(CANVAS_TABS)
      },
      outputSchema: { removed_nodes: z.number(), removed_edges: z.number() },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true }
    },
    async ({ board_id, tab }) => {
      assertCanvasTab(tab);
      const { body } = await loadBoard(board_id);
      const slot = tabSlot(body, tab);
      const n = slot.nodes.length;
      const e = slot.edges.length;
      slot.nodes = [];
      slot.edges = [];
      await saveBoard(board_id, body);
      return ok({ removed_nodes: n, removed_edges: e });
    }
  );
}
