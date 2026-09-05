#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerBoardTools } from "./tools/boards.js";
import { registerKeywordTools } from "./tools/keywords.js";
import { registerDocumentTools } from "./tools/documents.js";
import { registerCanvasTools } from "./tools/canvas.js";
import { registerContentTools } from "./tools/content.js";
import { registerFrameTools } from "./tools/frames.js";

const server = new McpServer({
  name: "strategy-board-mcp-server",
  version: "1.0.0"
});

registerBoardTools(server);
registerKeywordTools(server);
registerDocumentTools(server);
registerCanvasTools(server);
registerContentTools(server);
registerFrameTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  /* stdout carries the protocol, so anything human-readable goes to stderr */
  console.error("strategy-board-mcp-server ready on stdio");
}

main().catch((err) => {
  console.error("Failed to start:", err instanceof Error ? err.message : err);
  process.exit(1);
});
