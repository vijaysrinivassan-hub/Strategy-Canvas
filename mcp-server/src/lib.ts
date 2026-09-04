import { createClient, SupabaseClient } from "@supabase/supabase-js";

/* ---------------------------------------------------------------- config */

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `${name} is not set. Add it to the "env" block of this server's entry in your ` +
        `Claude config, then restart Claude.`
    );
  }
  return v;
}

let client: SupabaseClient | null = null;

/** The service role key is used deliberately: this server runs on your own
 *  machine and needs to bypass RLS to act on your behalf. It must never be
 *  put anywhere a browser can read it. */
export function db(): SupabaseClient {
  if (!client) {
    client = createClient(
      required("SUPABASE_URL"),
      required("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return client;
}

export const OWNER_ID = () => required("STRATEGY_BOARD_OWNER_ID");
export const BUCKET = "documents";

/* ---------------------------------------------------------------- shapes */

export const TABS = [
  "Product Architecture",
  "Market Research Frame",
  "Messaging Framework",
  "Positioning Document",
  "Growth Strategy",
  "Channel Strategy",
  "Content Strategy",
  "Keyword Repo",
  "Document Gallery"
] as const;

/** Tabs that hold a canvas. The rest are panels with their own shapes. */
export const CANVAS_TABS = [
  "Product Architecture",
  "Market Research Frame",
  "Messaging Framework",
  "Positioning Document",
  "Growth Strategy"
] as const;

export const CONTENT_VIEWS = ["category", "competitor", "icp", "value"] as const;

export interface BoardBody {
  version?: number;
  client?: string;
  logo?: string;
  tabs: Record<string, any>;
}

export interface BoardRow {
  id: string;
  title: string;
  body: string;
  owner_id: string;
  updated_at?: string;
}

/* ---------------------------------------------------------------- helpers */

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/** Anything that goes wrong should tell the agent what to do next. */
export class ToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolError";
  }
}

export async function loadBoard(boardId: string): Promise<{ row: BoardRow; body: BoardBody }> {
  const { data, error } = await db()
    .from("reports")
    .select("id,title,body,owner_id,updated_at")
    .eq("id", boardId)
    .single();

  if (error) {
    throw new ToolError(
      `Could not load board ${boardId}: ${error.message}. ` +
        `Call board_list to see the boards that exist.`
    );
  }

  let body: BoardBody;
  try {
    body = JSON.parse(data.body || "{}");
  } catch {
    body = { tabs: {} };
  }
  if (!body.tabs || typeof body.tabs !== "object") body.tabs = {};
  return { row: data as BoardRow, body };
}

export async function saveBoard(boardId: string, body: BoardBody, title?: string): Promise<void> {
  const patch: Record<string, unknown> = { body: JSON.stringify(body) };
  if (title) patch.title = title;
  const { error } = await db().from("reports").update(patch).eq("id", boardId);
  if (error) throw new ToolError(`Could not save board ${boardId}: ${error.message}`);
}

export function tabSlot(body: BoardBody, tab: string): any {
  if (!body.tabs[tab]) body.tabs[tab] = { nodes: [], edges: [] };
  const slot = body.tabs[tab];
  if (!Array.isArray(slot.nodes)) slot.nodes = [];
  if (!Array.isArray(slot.edges)) slot.edges = [];
  return slot;
}

export function assertCanvasTab(tab: string): void {
  if (!(CANVAS_TABS as readonly string[]).includes(tab)) {
    throw new ToolError(
      `"${tab}" is not a canvas tab. Canvas tabs are: ${CANVAS_TABS.join(", ")}. ` +
        `Content Strategy uses content_* tools, Keyword Repo uses keyword_* tools, ` +
        `Document Gallery uses document_* tools.`
    );
  }
}

/** Every tool returns the same envelope so responses stay predictable. */
export function ok<T>(data: T) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data as Record<string, unknown>
  };
}

export function fail(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true
  };
}
