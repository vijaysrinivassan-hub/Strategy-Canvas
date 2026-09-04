# Strategy Board

An infinite canvas for strategy work, in the style of Obsidian Canvas. One board
per client, eight tabs per board, each tab its own canvas.

## The canvas

| Action | How |
|---|---|
| Add a note | Double-click empty canvas, or **+ Note** |
| Edit a note | Double-click it. `Esc` cancels, `Ctrl/Cmd+Enter` commits |
| Move a note | Drag it |
| Resize a note | Drag the corner grip |
| Connect two notes | Hover a note, drag from one of its four edge dots onto another note |
| Colour a note | Select it, pick from the palette above it |
| Select several | Drag a box across the canvas — anything it touches is selected |
| Add to a selection | `Shift`-drag another box, or `Shift`-click a card |
| Select everything | `Ctrl/Cmd`+`A` |
| Move many at once | Drag any selected card; the whole selection follows |
| Group a selection | The group button on the floating bar, or `Ctrl/Cmd`+`G` |
| Add an empty group | The fourth dock button. Drag cards inside it |
| Move a group | Drag its label — every card inside travels with it |
| Rename a group | Double-click its label |
| Delete | Select a note, connection or group, press `Delete` |
| Pan | `Space`+drag, or middle-mouse drag |
| Zoom | Scroll, or the toolbar buttons |
| Frame everything | **Fit** |

Connections are cubic bezier curves that leave each anchor perpendicular to its
side, which is what gives them their shape, and the target side is chosen
automatically from the relative position of the two notes.

## Tabs

Product Architecture · Market Research Frame · Messaging Framework ·
Positioning Document · Growth Strategy · Channel Strategy · Content Strategy ·
Keyword Repo · Document Gallery

The first seven hold an independent canvas each; the count beside a tab is its
card count.

**Document Gallery** is not a canvas. It is a column board for files. Drag files
onto it (or straight into a column) and they upload to Supabase Storage, filed
under the current board. Word, Excel, PDF, PowerPoint and images are recognised
and badged; each file opens through a short-lived signed URL, or can be removed.

Columns start as Inbox / Research / Working / Final and are yours to change:
**+ Column** adds one, double-click a heading to rename it, and drag a file card
from one column to another. Double-click a file's name to rename it — that is a
display name only, so the stored object is never touched.

**Keyword Repo** is two stacked tables. The lower one holds everything pulled
from Ahrefs; the upper one holds what you have chosen. `+` on a repo row
promotes it, `−` on a selected row sends it back — the only thing that changes is
a `selected` flag on the row. A filter box narrows the repo.

Keywords live in their own Postgres table rather than in the board JSON, so an
MCP server (or any script) can write them directly. Run `supabase-keywords.sql`
once to create it. The unique index on `(board_id, lower(keyword), country)` means
a re-import can upsert instead of duplicating.

**Channel Strategy** is not a canvas either. It is a scope checklist: one card
per channel, ticked for in-scope and greyed for "not doing", so a client can see
at a glance what is and isn't included. Click a card to toggle it, double-click
its name to rename, and **+ Add channel** for anything new. The starting four are
just defaults written into the board on first use — nothing is hardcoded.

Run `supabase-storage.sql` once to create the bucket and its policies. Until you
do, the gallery says so plainly rather than failing on upload.

## Data

Boards live in Supabase, one row per board, with every tab serialised into it.
Node and edge shapes follow the [JSON Canvas](https://jsoncanvas.org) vocabulary
(`nodes` with `x/y/width/height/text`, `edges` with `fromNode/fromSide/toNode/toSide`).

Access is enforced by Postgres Row Level Security — `auth.uid() = owner_id` is
checked on every query, so the publishable key in this file grants nothing on its
own. Run `supabase-setup.sql` once to create the table and its policies.

Autosaves a couple of seconds after any change; **Save** forces it.

## Config

The Supabase URL, the publishable key and the Google client ID at the top of
`index.html` are all public values, safe in page source. The Google **client
secret** and the Supabase **service_role** key are not, and appear nowhere here.

`ALLOWED` is a front-door email list. It is a convenience, not the security
boundary — RLS is.
