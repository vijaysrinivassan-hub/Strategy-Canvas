import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadBoard, ok, saveBoard, tabSlot } from "../lib.js";
import { architecturePrompts, DOCUMENT_SECTION_PROMPTS } from './architecture.js';

const TAB = "Strategy 1 — Positioning Document";
const FIELD_KEYS = [
  "positioning_statement",
  "icp_positioning",
  "category_positioning",
  "competitive_positioning",
  "value_positioning",
  "usp",
  "offer",
  "trust_signals",
  "ideal_brand_perception",
  "framing"
] as const;
const DISTRIBUTION_PLATE_KEYS = ["words_50", "words_100", "words_200", "words_400"] as const;
/* Awareness Messaging Framework: one brief per awareness level. */
const MESSAGING_KEYS = ["problem_unaware", "problem_aware", "solution_aware", "category_aware", "competitor_aware"] as const;
const DEFAULT_FRAMING_COUNT = 2;

const distributionPlateSchema = z.object({
  words_50: z.string().optional(),
  words_100: z.string().optional(),
  words_200: z.string().optional(),
  words_400: z.string().optional()
});

const messagingFrameworkSchema = z.object({
  problem_unaware: z.string().optional(),
  problem_aware: z.string().optional(),
  solution_aware: z.string().optional(),
  category_aware: z.string().optional(),
  competitor_aware: z.string().optional()
});

const framingFrameSchema = z.object({
  id: z.string(),
  label: z.string(),
  text: z.string()
});

const fieldsSchema = z.object({
  positioning_statement: z.string().optional(),
  icp_positioning: z.string().optional(),
  category_positioning: z.string().optional(),
  competitive_positioning: z.string().optional(),
  value_positioning: z.string().optional(),
  usp: z.string().optional(),
  offer: z.string().optional(),
  trust_signals: z.string().optional(),
  ideal_brand_perception: z.string().optional(),
  framing: z.string().optional(),
  framing_frames: z.array(framingFrameSchema).optional(),
  distribution_plate: distributionPlateSchema.optional(),
  messaging_framework: messagingFrameworkSchema.optional()
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
  if (!slot.fields.messaging_framework || typeof slot.fields.messaging_framework !== "object") {
    slot.fields.messaging_framework = {};
  }
  for (const key of MESSAGING_KEYS) {
    if (typeof slot.fields.messaging_framework[key] !== "string") slot.fields.messaging_framework[key] = "";
  }
  if (!Array.isArray(slot.fields.framing_frames)) {
    slot.fields.framing_frames = Array.from({ length: DEFAULT_FRAMING_COUNT }, (_, index) => ({
      id: `frame_${index + 1}`,
      label: index === 0 ? "Brand Level Framing" : "",
      text: index === 0 ? slot.fields.framing : ""
    }));
  }
  slot.fields.framing_frames = slot.fields.framing_frames.map((frame: any, index: number) => ({
    id: String(frame?.id || `frame_${index + 1}`),
    label: index === 0
      ? "Brand Level Framing"
      : (typeof frame?.label === "string" && !/^Frame\s+\d+$/i.test(frame.label) ? frame.label : ""),
    text: String(frame?.text || "")
  }));
  const defaults = slot.fields.framing_frames.slice(1, 4);
  const defaultNames = ["capability", "value", "category"];
  if (defaults.length === 3 && defaults.every((frame: any, index: number) => {
    const name = String(frame.label || "").trim().toLowerCase();
    return !name || name === defaultNames[index] || name === `frame ${index + 2}`;
  })) {
    const combined = defaults[0];
    combined.label = "";
    combined.text = defaults.map((frame: any) => String(frame.text || "").trim()).filter(Boolean).join("\n\n");
    slot.fields.framing_frames.splice(1, 3, combined);
  }
  while (slot.fields.framing_frames.length < DEFAULT_FRAMING_COUNT) {
    const index = slot.fields.framing_frames.length;
    slot.fields.framing_frames.push({ id: `frame_${index + 1}`, label: index === 0 ? "Brand Level Framing" : "", text: "" });
  }
  return slot.fields;
}

export function registerPositioningDocumentTools(server: McpServer) {
  server.registerTool(
    "positioning_document_get",
    {
      title: "Read positioning document",
      description:
        "Read the nine narrative fields and Distribution Plate in a board's Positioning Document: " +
        "the positioning statement; ICP, category, competitive and value positioning; Trust Signals; " +
        "Ideal Brand Perception and Framing frames; USP; Offer; the Awareness Messaging Framework (problem unaware, problem-aware, " +
        "solution-aware, category-aware and competitor-aware briefs); and the 50-, 100-, 200- and 400-word Distribution Plate versions. " +
        "Returns the shared rules prompt plus one AI prompt per document section.",
      inputSchema: {
        board_id: z.string().describe("Board uuid from board_list")
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
    },
    async ({ board_id }) => {
      const { body } = await loadBoard(board_id);
      const section_prompts: Record<string, unknown> = {};
      for (const key of DOCUMENT_SECTION_PROMPTS) section_prompts[key] = await architecturePrompts(body, key);
      return ok({ fields: fieldsOf(body), ai_prompt: await architecturePrompts(body, 'positioning_document'), section_prompts });
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
        if (typeof fields[key] === "string") {
          current[key] = fields[key];
          if (key === "framing" && Array.isArray(current.framing_frames) && current.framing_frames[0]) {
            current.framing_frames[0].text = fields[key];
          }
        }
      }
      if (fields.framing_frames) {
        current.framing_frames = fields.framing_frames.map(frame => ({ ...frame }));
        if (current.framing_frames[0]) current.framing = current.framing_frames[0].text;
      }
      if (fields.messaging_framework) {
        for (const key of MESSAGING_KEYS) {
          if (typeof fields.messaging_framework[key] === "string") current.messaging_framework[key] = fields.messaging_framework[key];
        }
      }
      if (fields.distribution_plate) {
        for (const key of DISTRIBUTION_PLATE_KEYS) {
          if (typeof fields.distribution_plate[key] === "string") current.distribution_plate[key] = fields.distribution_plate[key];
        }
      }
      /* The browser also keeps the selected product's document in productWorkspaces; keep both copies
         in step so a later product switch does not restore the older workspace value. */
      const productId = body.workspaceProductId;
      if (productId) {
        body.productWorkspaces ||= {};
        const workspace = body.productWorkspaces[productId] ||= { tabs: {} };
        workspace.tabs ||= {};
        const productTab = workspace.tabs[TAB] ||= { nodes: [], edges: [] };
        productTab.fields = JSON.parse(JSON.stringify(current));
      }
      await saveBoard(board_id, body);
      return ok({ fields: current });
    }
  );
}
