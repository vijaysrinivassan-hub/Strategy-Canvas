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

export const BUCKET = "documents";

let cachedOwner: string | null = null;

/** Which account owns the boards. Worked out rather than configured: the
 *  service role key can see the existing boards, so there is nothing for a
 *  human to look up and paste. */
export async function ownerId(): Promise<string> {
  if (cachedOwner) return cachedOwner;

  const { data: boards } = await db()
    .from("reports")
    .select("owner_id")
    .order("updated_at", { ascending: false })
    .limit(1);
  if (boards && boards.length && boards[0].owner_id) {
    cachedOwner = boards[0].owner_id as string;
    return cachedOwner;
  }

  /* no boards yet, so fall back to the only account that can have made one */
  const { data: users, error } = await db().auth.admin.listUsers();
  if (error) {
    throw new ToolError(
      `Could not work out which account owns these boards: ${error.message}. ` +
        `Check that SUPABASE_SERVICE_ROLE_KEY is the service_role key, not the ` +
        `publishable one.`
    );
  }
  if (!users || !users.users.length) {
    throw new ToolError(
      "This Supabase project has no users yet. Sign in to the Strategy Board once " +
        "in the browser, then try again."
    );
  }
  cachedOwner = users.users[0].id;
  return cachedOwner;
}

/** Files and rows belong to whoever owns that board, not to a global setting. */
export async function boardOwner(boardId: string): Promise<string> {
  const { data, error } = await db()
    .from("reports")
    .select("owner_id")
    .eq("id", boardId)
    .single();
  if (error) {
    throw new ToolError(
      `Could not find board ${boardId}: ${error.message}. Call board_list to see ` +
        `which boards exist.`
    );
  }
  return data.owner_id as string;
}

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
  "Repo"
] as const;

/** The five canvases every board starts with. A board can carry more:
 *  anything under Brand Strategy that the user added is a canvas too, so the
 *  canvas tools take a plain name and check it against the board itself. */
export const CANVAS_TABS = [
  "Product Architecture",
  "Market Research Frame",
  "Messaging Framework",
  "Positioning Document",
  "Growth Strategy"
] as const;

/** Tabs that are panels, not canvases. Everything else on a board is one. */
export const PANEL_TABS = [
  "Channel Strategy",
  "Content Strategy",
  "Keyword Repo",
  "Repo"
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
  if ((PANEL_TABS as readonly string[]).includes(tab)) {
    throw new ToolError(
      `"${tab}" is a panel, not a canvas. Content Strategy uses content_* tools, ` +
        `Keyword Repo uses keyword_* tools, Repo uses document_* tools.`
    );
  }
}

/** Canvas tabs on one board: the five defaults plus whatever the user added
 *  under Brand Strategy, which board_get also lists. */
export function canvasTabsOf(body: BoardBody): string[] {
  const extra = Array.isArray((body as any).extra) ? ((body as any).extra as string[]) : [];
  return (CANVAS_TABS as readonly string[]).concat(extra.filter((x) => typeof x === "string"));
}

export function assertCanvasOnBoard(body: BoardBody, tab: string): void {
  assertCanvasTab(tab);
  const known = canvasTabsOf(body);
  if (!known.includes(tab)) {
    throw new ToolError(
      `No canvas called "${tab}" on this board. Canvases are: ${known.join(", ")}. ` +
        `Add one in the app under Brand Strategy, then retry.`
    );
  }
}

/** Every tool returns the same envelope so responses stay predictable.
 *  Deliberately text-only: declaring an outputSchema makes the SDK emit a
 *  draft-07 JSON Schema, which newer MCP clients reject outright. The JSON is
 *  in the text, which every client can read. */
export function ok<T>(data: T) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }]
  };
}

export function fail(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true
  };
}
