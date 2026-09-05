# Strategy Board MCP server

Lets Claude work on your Strategy Board directly: read and write keywords, read
the documents you have attached, draw on the canvases, and fill in the content
tables.

Runs locally over stdio. Nothing is exposed to the internet.

## Build

```bash
cd mcp-server
npm install
npm run build
```

## The two values it needs

| Variable | Where to find it |
|---|---|
| `SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → **service_role** |

Nothing else. Which account owns the boards is worked out from the boards
themselves, and which board to act on is something you say in the conversation
("use the Luca board") rather than something you configure.

**About the service_role key.** It bypasses Row Level Security, which is exactly
why it belongs here and nowhere near a browser. This server runs on your machine
and acts as you. Never put it in `index.html`, never commit it, never paste it
into a chat. If it ever leaks, rotate it in the Supabase dashboard.

## Connect it to Claude

### Claude Desktop

Edit the config file:

- **Windows** — `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS** — `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "strategy-board": {
      "command": "node",
      "args": ["C:\\Users\\vijay\\OneDrive\\Desktop\\strategy-canvas\\mcp-server\\dist\\index.js"],
      "env": {
        "SUPABASE_URL": "https://YOUR-PROJECT.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your service_role key"
      }
    }
  }
}
```

Restart Claude Desktop. The tools appear under the connectors icon.

### Claude Code

```bash
claude mcp add strategy-board \
  --env SUPABASE_URL=https://YOUR-PROJECT.supabase.co \
  --env SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
  -- node /absolute/path/to/mcp-server/dist/index.js
```

### Checking it works

```bash
npm run inspect
```

Opens the MCP Inspector, where every tool can be called by hand.

## What Claude can do with it

**Boards** — `board_list`, `board_get`, `board_create`

**Keywords** — `keyword_list`, `keyword_upsert`, `keyword_set_selected`,
`keyword_delete`. Upserts match on keyword plus country, case-insensitively, so
re-running an export updates rather than duplicates.

**Documents** — `document_list`, `document_read` (text files inline),
`document_link` (a signed URL for PDFs and spreadsheets), `document_upload`
(from a path on this machine, filed into a gallery column).

**Canvas** — `canvas_get`, `canvas_add_cards`, `canvas_connect`,
`canvas_add_group`, `canvas_clear`. Cards laid out without explicit
coordinates are arranged in a grid to the right of whatever is already there.

**Content** — `content_get`, `content_set_rows` (the category, ICP and value
tables), `content_plan_article` (tick a competitor-matrix cell and set AEO or
SEO), `channel_set`.

Things worth asking for:

- *"Read the audit in Luca's Document Gallery and turn its findings into a
  Product Architecture canvas, grouped by theme."*
- *"Import these 200 Ahrefs rows into the Luca board, then select everything
  above 500 volume with KD under 20."*
- *"Which competitor articles are we planning for AEO rather than SEO?"*

## Notes

- Tools that change or delete data are annotated, so Claude can tell them apart
  from reads.
- Board content lives as JSON inside one `reports` row, so canvas and content
  writes are read-modify-write. Two writers at once can overwrite each other;
  avoid editing the same board in the app while Claude is working on it.
- Keywords live in their own `keywords` table and have no such limitation.
