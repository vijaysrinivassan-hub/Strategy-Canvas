# Strategy Board

An infinite canvas for strategy work, in the style of Obsidian Canvas. One board
per client, eight tabs per board, each tab its own canvas.

## The canvas

| Action | How |
|---|---|
| Add a note | Double-click empty canvas |
| Edit a note | Double-click it, or select it and press `Enter`. `Esc` cancels, `Ctrl/Cmd+Enter` commits |
| Move a note | Drag it |
| Paste text | With a card selected it fills that card; with nothing selected it drops one card per blank-line-separated block |
| Resize a note | Drag the corner grip |
| Connect two notes | Drag from anywhere along a card's edge onto another card. Nothing is drawn on the edge — the cursor turns to a crosshair — and the wire leaves from the middle of whichever side you grabbed |
| Colour a note | Select it, then **Colour** on the bar above it |
| Select several | Drag a box across the canvas — anything it touches is selected |
| Add to a selection | `Shift`-drag another box, or `Shift`-click a card |
| Select everything | `Ctrl/Cmd`+`A` |
| Move many at once | Drag any selected card; the whole selection follows |
| Group a selection | **Create group** on the bar above it, or `Ctrl/Cmd`+`G` |
| Move a group | Drag its label — every card inside travels with it |
| Rename a group | Double-click its label |
| Delete | Select a note, connection or group, press `Delete` |
| Pan | Two-finger swipe on a trackpad, two fingers on a touchscreen, `Space`+drag, or middle-mouse drag |
| Zoom | Pinch, `Ctrl`+scroll, or a mouse wheel |
| Line cards up | **Align** on the bar above them: six edges and centres |
| Align while dragging | Automatic — edges and centres snap to nearby cards and a guide line shows the match |
| Frame everything | The dashed-square button in the bottom-right corner |
| Frame just the selection | **Zoom to selection** on the bar above it |

Selecting anything raises a small bar above it — **Delete**, **Colour**, **Zoom
to selection**, **Create group**, **Align** — each named as you hover it. Nothing
on it happens on its own: grouping is offered as a choice and waits to be asked.
Create group and Align both need two or more cards.

Connections are cubic bezier curves that leave each anchor perpendicular to its
side, which is what gives them their shape, and the target side is chosen
automatically from the relative position of the two notes.

## Tabs

The sidebar groups them:

- **Brand Strategy** opens into Product Architecture, Market Research Frame,
  Messaging Framework, Positioning Document and Growth Strategy. Each is its own
  canvas; the count beside one is its card count. Those five always exist —
  **+ New canvas** adds as many more as you like, double-click one to rename it,
  and the × beside it removes it. **Drag any of them by the grip that appears on
  hover to change the order.** Added canvases and the order are saved with the board.
- **Channel Strategy** — a scope checklist.
- **Content Strategy** opens into Category, Competitor, ICP and Value.
- **Keyword Repo** and **Grounded Evidences**.
- **Frames** — the reference frames from the Obsidian vault, read-only.

Only one group stands open at a time: expanding one closes the rest.

## Two views

The chip at the top right — your name, next to the frame picker — is where you
switch between two views of the same board, the way Google switches accounts:

- **Admin view** is everything: every tab, the keyword repo, the frames, Settings.
- **Client view** is the strategy work and nothing behind it. Keyword Repo,
  Frames and Settings are gone from the sidebar, the frame picker is gone from
  the toolbar, and the board is read-only.

Somebody given viewer access by email is always in client view, and only sees
the boards they were given — a Luca client sees Luca's board and nothing else.
An admin can step into client view to see exactly what a client will see; it is
read-only there too, so the look is an honest one, and the choice is remembered
on that browser. Sign out lives in the same chip, and so does a board switcher
whenever more than one board is to hand.

The client's name heads the sidebar, with no logo beside it. **Settings** is the
sidebar's footer: one button that opens one page with Clients, Article Types and
MCP stacked on it. Name and logo are edited there — **Edit** on a client's card,
or double-click the name at the top of the sidebar.

## Frames

`Frames` mirrors the `Frames` folder of the Obsidian vault. Obsidian's `.canvas`
files are JSON Canvas, the same vocabulary this app uses, so they render on the
ordinary canvas with their cards, groups and connections intact; the `.md` notes
render as plain documents.

**You can edit them.** Several carry a note inside saying no AI may write to
them, but that was an instruction to AI, not to their author, so the rule lives
in the MCP server instead: it exposes `frame_list` and `frame_get` and has no
tool that writes a frame, and the canvas write tools refuse a frame by name.

Your edits are kept **with the board you are on**, never written back to the
vault. An edited frame shows an amber dot in the sidebar and an *Edited on this
board* badge with **Reset to original**, which loads the vault copy again.
**Download** hands you the frame as a `.canvas` (or `.md`) file, so you can drop
it into the vault yourself if you want the change to stick there.

To refresh them after editing in Obsidian:

```bash
node tools/import-frames.mjs
```

That rewrites `frames.json`, which the app fetches at load. Pass a path as the
first argument if the vault is not at `~/OneDrive/Documents/Obsidian Vault/Frames`.

### Frames as templates

Every canvas carries an **Insert a frame…** dropdown in its toolbar. Pick a frame
and a copy of it lands on the canvas you are on, clear of whatever is already
there, with its groups and connections intact. The copy gets fresh ids, so the
same frame can be dropped in twice, and it is yours to edit — the frame itself is
never touched.

The toolbar carries the page title, the frame picker and the account chip.
The canvas itself stays bare: no add-bar, no hint text, no zoom buttons — just
the dashed-square Fit button in the bottom-right corner. Boards are
chosen and created on the Clients screen, saving happens on its own a couple of
seconds after any change (`Ctrl/Cmd+S` forces it), and the save state sits at the
foot of the sidebar.

## Grounded Evidences

**Grounded Evidences** is not a canvas. The screen is six columns wide: the last
one is the file repo, and the five to its left are one writing area.

The writing area is a stack of named rows. Each row holds free text, links and
files. **+ Add row** adds one, double-click a heading to rename it, **+ Link**
pins a link to it, and dragging the bar at the bottom of a row makes it taller —
the height is saved with the board.

Every upload lands in the repo column on the right, and you drag it into whichever
row it belongs to. The **+** tile at the foot of that column opens the file
picker, and it takes dropped files too. Files move between rows by dragging, and
the ← button on a filed card sends it back to the repo.

Word, Excel, PDF, PowerPoint and images are recognised and badged; each file opens
through a short-lived signed URL, or can be removed. Double-click a file's name to
rename it — that is a display name only, so the stored object is never touched.

The tab was called Document Gallery, then Repo. Boards saved under either name
open unchanged: old columns become rows, keeping their names and the files filed
under them.

**Content Strategy** opens into four axes in the sidebar — Category, Competitor,
ICP and Value. Competitor is a matrix; Category, ICP and Value are plain tables
of 20 rows.

In those three the unit is the **cell**, not the row. Each cell holds the words,
a green **Write this** tick, its own **AEO / SEO** choice, its **type** (from
Settings) and the reader's **awareness** level — Problem aware, Solution aware,
Feature aware or Competitor aware — because all of those follow the keyword: the
same category can be worth an AEO listicle for the problem-aware in one column
and an SEO explainer for the competitor-aware in the next. The controls stay
faded on an empty cell and come up on hover, so a blank table still reads as a
table, and nothing is written to the board for a cell you have not filled in.

A cell also shows its **evidence**: every keyword in the repo — pushed through
the MCP or added by hand — that contains the cell's words, each with its search
volume, and the **total** underneath. Two keywords at 50 read as *100 total*.
**+ kw** adds a keyword to the repo seeded with the cell's words.

The competitor matrix uses the **very same cell** — one shared builder draws
both — so a matrix cell also takes the article's own words, the tick, AEO / SEO,
type and awareness, and shows its evidence with a total. What a matrix cell
catches is the repo keywords that mention the competitor and the column's terms,
plus any that contain the words you wrote in it.

The list of article types lives under **Settings › Article Types** — Listicle,
List item and Informational to start, and yours to rename, remove or add to. It
saves with the client's board, so different clients can keep different lists.
Removing one that is in use leaves those cells their words and clears the type.

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
what you approve.

**Keyword Repo** is one table: everything pulled from Ahrefs or pushed through
the MCP, with a filter box to narrow it. There is no separate "selected" list any
more — approval lives in the content cells' ticks. A `selected` flag still exists
on each row for the MCP's sake, but nothing in the app reads it.

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
board record, so a logo needs no bucket and never expires. The whole mark is always shown — the tile widens for a wide logo rather than cropping it.

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
