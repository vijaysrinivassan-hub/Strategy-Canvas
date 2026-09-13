import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadBoard, ok, saveBoard, tabSlot } from "../lib.js";

const TAB = "Strategy 1 — Positioning Document";
const FIELD_KEYS = [
  "positioning_statement",
  "icp_positioning",
  "category_positioning",
  "competitive_positioning",
  "value_positioning"
] as const;

const fieldsSchema = z.object({
  positioning_statement: z.string().optional(),
  icp_positioning: z.string().optional(),
  category_positioning: z.string().optional(),
  competitive_positioning: z.string().optional(),
  value_positioning: z.string().optional()
});

function fieldsOf(body: any): Record<(typeof FIELD_KEYS)[number], string> {
  const slot = tabSlot(body, TAB);
  if (!slot.fields || typeof slot.fields !== "object") slot.fields = {};
  for (const key of FIELD_KEYS) {
    if (typeof slot.fields[key] !== "string") slot.fields[key] = "";
  }
  return slot.fields;
}

export function registerPositioningDocumentTools(server: McpServer) {
  server.registerTool(
    "positioning_document_get",
    {
      title: "Read positioning document",
      description:
        "Read the five narrative fields in a board's Positioning Document: the positioning " +
        "statement plus ICP, category, competitive and value positioning.",
      inputSchema: {
        board_id: z.string().describe("Board uuid from board_list")
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
    },
    async ({ board_id }) => {
      const { body } = await loadBoard(board_id);
      return ok({ fields: fieldsOf(body) });
    }
  );

  server.registerTool(
    "positioning_document_set",
    {
      title: "Update positioning document",
      description:
        "Write one or more narrative fields in the Positioning Document. Omitted fields " +
        "remain unchanged, so an AI can update one section without replacing the others.",
      inputSchema: {
        board_id: z.string().describe("Board uuid from board_list"),
        fields: fieldsSchema.describe("One or more Positioning Document fields to update")
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true }
    },
    async ({ board_id, fields }) => {
      const { body } = await loadBoard(board_id);
      const current = fieldsOf(body);
      for (const key of FIELD_KEYS) {
        if (typeof fields[key] === "string") current[key] = fields[key];
      }
      await saveBoard(board_id, body);
      return ok({ fields: current });
    }
  );
}
