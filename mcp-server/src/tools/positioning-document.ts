import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadBoard, ok, saveBoard, tabSlot } from "../lib.js";
import { architecturePrompts } from './architecture.js';

const TAB = "Strategy 1 — Positioning Document";
const FIELD_KEYS = [
  "positioning_statement",
  "icp_positioning",
  "category_positioning",
  "competitive_positioning",
  "value_positioning",
  "usp",
  "trust_signals",
  "framing"
] as const;
const DISTRIBUTION_PLATE_KEYS = ["words_50", "words_100", "words_200", "words_400"] as const;

const distributionPlateSchema = z.object({
  words_50: z.string().optional(),
  words_100: z.string().optional(),
  words_200: z.string().optional(),
  words_400: z.string().optional()
});

const fieldsSchema = z.object({
  positioning_statement: z.string().optional(),
  icp_positioning: z.string().optional(),
  category_positioning: z.string().optional(),
  competitive_positioning: z.string().optional(),
  value_positioning: z.string().optional(),
  usp: z.string().optional(),
  trust_signals: z.string().optional(),
  framing: z.string().optional(),
  distribution_plate: distributionPlateSchema.optional()
});

function fieldsOf(body: any): Record<string, any> {
  const slot = tabSlot(body, TAB);
  if (!slot.fields || typeof slot.fields !== "object") slot.fields = {};
  for (const key of FIELD_KEYS) {
    if (typeof slot.fields[key] !== "string") slot.fields[key] = "";
  }
  if (!slot.fields.distribution_plate || typeof slot.fields.distribution_plate !== "object") {
    slot.fields.distribution_plate = {};
  }
  for (const key of DISTRIBUTION_PLATE_KEYS) {
    if (typeof slot.fields.distribution_plate[key] !== "string") slot.fields.distribution_plate[key] = "";
  }
  return slot.fields;
}

export function registerPositioningDocumentTools(server: McpServer) {
  server.registerTool(
    "positioning_document_get",
    {
      title: "Read positioning document",
      description:
        "Read the eight narrative fields and Distribution Plate in a board's Positioning Document: " +
        "the positioning statement; ICP, category, competitive and value positioning; Trust Signals; " +
        "Framing; USP; and the 50-, 100-, 200- and 400-word Distribution Plate versions.",
      inputSchema: {
        board_id: z.string().describe("Board uuid from board_list")
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
    },
    async ({ board_id }) => {
      const { body } = await loadBoard(board_id);
      return ok({ fields: fieldsOf(body), ai_prompt: await architecturePrompts(body, 'positioning_document') });
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
      if (fields.distribution_plate) {
        for (const key of DISTRIBUTION_PLATE_KEYS) {
          if (typeof fields.distribution_plate[key] === "string") current.distribution_plate[key] = fields.distribution_plate[key];
        }
      }
      await saveBoard(board_id, body);
      return ok({ fields: current });
    }
  );
}
