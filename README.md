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
| Connect two notes | Drag from anywhere along a card's edge onto another card. Nothing is drawn on the edge — the cursor turns to a crosshair — and the wire leaves from the middle of whichever side you grabbed |
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
| Pan | Two-finger swipe on a trackpad, two fingers on a touchscreen, `Space`+drag, or middle-mouse drag |
| Zoom | Pinch, `Ctrl`+scroll, a mouse wheel, or the toolbar buttons |
| Align while dragging | Automatic — edges and centres snap to nearby cards and a guide line shows the match |
| Frame everything | **Fit** |

Connections are cubic bezier curves that leave each anchor perpendicular to its
side, which is what gives them their shape, and the target side is chosen
automatically from the relative position of the two notes.

## Tabs

The sidebar groups them:

- **Brand Strategy** opens into Product Architecture, Market Research Frame,
  Messaging Framework, Positioning Document and Growth Strategy. Each is its own
  canvas; the count beside one is its card count.
- **Channel Strategy** — a scope checklist.
- **Content Strategy** opens into Category, Competitor, ICP and Value.
- **Keyword Repo** and **Document Gallery**.

The toolbar carries only the page title and the canvas zoom controls. Boards are
chosen and created on the Clients screen, saving happens on its own a couple of
seconds after any change (`Ctrl/Cmd+S` forces it), and the save state sits at the
foot of the sidebar.

**Document Gallery** is not a canvas. It is a column board for files. Drag files
onto it (or straight into a column) and they upload to Supabase Storage, filed
under the current board. Word, Excel, PDF, PowerPoint and images are recognised
and badged; each file opens through a short-lived signed URL, or can be removed.

Columns start as Inbox / Research / Working / Final and are yours to change:
**+ Column** adds one, double-click a heading to rename it, and drag a file card
from one column to another. Double-click a file's name to rename it — that is a
display name only, so the stored object is never touched.

**Content Strategy** opens into four axes in the sidebar — Category, Competitor,
ICP and Value. Each is its own matrix with its own rows and its own article-type
columns, so the plan can be sliced four ways without four tabs.

Each matrix has rows down the side, article types across
the top (Alternatives, Pricing, Reviews, Features to start). Every keyword in the
repo drops into the cells it fits — a keyword matches a row when it mentions that
competitor or one of its aliases, and a column when it contains one of that
column's match terms. Both lists are editable: **+ Competitor**, **+ Article
type**, double-click any heading to rename, and the small *terms* / *aliases*
buttons widen what a row or column catches.

Each cell carries one **Write this** tick — a single approval for the article,
present whether or not a keyword — plenty of articles get written without one. It is green, and tints
the cell, so it never reads as a keyword selection.

Keywords beneath it are shown as evidence, not as separate choices: the cell is
what you approve. Selecting individual keywords stays in the Keyword Repo.

**Keyword Repo** is two stacked tables. The lower one holds everything pulled
from Ahrefs; the upper one holds what you have chosen. `+` on a repo row
promotes it, `−` on a selected row sends it back — the only thing that changes is
a `selected` flag on the row. A filter box narrows the repo.

Enter keywords three ways: **+ Keyword** for one with its metrics, **Paste rows**
for a whole Ahrefs export (tab- or comma-separated, header optional), or the
**+ keyword** line inside any matrix cell, which pre-fills the competitor and
article type. A re-paste updates rows it has seen before rather than duplicating
them, and repeats inside one paste are collapsed first.

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

## Clients and access

Click the logo tile beside the client name (or **Edit** on a client card) to
open **Client** settings: rename the client, and give it a logo by uploading an
image or pasting a URL. Uploads are downscaled to 256px and stored inside the
board record, so a logo needs no bucket and never expires.

**Clients** is the first item in the sidebar: a card per board, with **+ New
client** to start another. Each client's board carries the same nine tabs.

Whoever creates a board owns it and can edit everything. **Access** on an owned
card opens a list of email addresses; anyone on it can open that board and read
every tab, and change nothing. Their view hides Save, the canvas dock, upload,
and the add buttons, and shows a "View only" strip instead.

That is enforced in Postgres, not in JavaScript. `can_view_board()` decides every
read; writes stay restricted to `owner_id = auth.uid()`. Hiding the buttons is
courtesy — the database is the boundary. Run `supabase-access.sql` to set it up.

## Data

Boards live in Supabase, one row per board, with every tab serialised into it.
Node and edge shapes follow the [JSON Canvas](https://jsoncanvas.org) vocabulary
(`nodes` with `x/y/width/height/text`, `edges` with `fromNode/fromSide/toNode/toSide`).

Access is enforced by Postgres Row Level Security — `auth.uid() = owner_id` is
checked on every query, so the publishable key in this file grants nothing on its
own. Run `supabase-setup.sql` once to create the table and its policies.

Autosaves a couple of seconds after any change; **Save** forces it.

## Look and feel

The UI follows the Maximus Labs Content Dashboard design system so the two read
as one product: Inter, `#2563eb` accent, `#f6f7f9` app background, white 252px
sidebar with icon nav and an `--accent-soft` active pill, 1px `#e9eaee` borders
with a soft shadow, 14px card corners, 9px buttons, uppercase pill badges.

The dashboard is light-only, so this is too — the previous dark theme was dropped
rather than left to drift out of step.

## Config

The Supabase URL, the publishable key and the Google client ID at the top of
`index.html` are all public values, safe in page source. The Google **client
secret** and the Supabase **service_role** key are not, and appear nowhere here.

`ALLOWED` is a front-door email list. It is a convenience, not the security
boundary — RLS is.
