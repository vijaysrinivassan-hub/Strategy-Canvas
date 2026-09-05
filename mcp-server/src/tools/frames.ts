import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { frameLibrary, ok, ToolError } from "../lib.js";

/**
 * The frames come out of the user's Obsidian vault, and several of them carry
 * a line inside saying no AI may write to them. That instruction lives here:
 * these tools read frames and there is deliberately no tool that writes one.
 * The person can edit a frame in the app; an agent cannot, through any path.
 */
export function registerFrameTools(server: McpServer) {
  server.registerTool(
    "frame_list",
    {
      title: "List the frames",
      description:
        "List the reference frames from the user's Obsidian vault: the positioning steps " +
        "and the other frames they work from. Read-only — frames cannot be written through " +
        "this server, by instruction of their author. To use one, read it with frame_get and " +
        "copy what you need onto a board canvas with canvas_add_cards.",
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
    },
    async () => {
      const frames = await frameLibrary();
      return ok({
        count: frames.length,
        writable: false,
        frames: frames.map((f: any) => ({
          name: f.name,
          kind: f.kind,
          cards: f.kind === "canvas" ? (f.nodes || []).length : null,
          connections: f.kind === "canvas" ? (f.edges || []).length : null
        }))
      });
    }
  );

  server.registerTool(
    "frame_get",
    {
      title: "Read a frame",
      description:
        "Read one frame in full: its cards and connections, or its text if it is a note. " +
        "Read-only. Copy what you need onto a board with canvas_add_cards rather than trying " +
        "to change the frame.",
      inputSchema: { name: z.string().describe("Frame name, exactly as frame_list gives it") },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
    },
    async ({ name }) => {
      const frames = await frameLibrary();
      const f = frames.find((x: any) => String(x.name).toLowerCase() === name.toLowerCase());
      if (!f) {
        throw new ToolError(
          `No frame called "${name}". Call frame_list to see the frames that exist.`
        );
      }
      return f.kind === "note"
        ? ok({ name: f.name, kind: "note", writable: false, text: f.text || "" })
        : ok({
            name: f.name,
            kind: "canvas",
            writable: false,
            nodes: f.nodes || [],
            edges: f.edges || []
          });
    }
  );
}
