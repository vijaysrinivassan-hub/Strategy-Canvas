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
| Add a group | The fourth dock button. Drag cards inside it |
| Move a group | Drag its label — every card inside travels with it |
| Rename a group | Double-click its label |
| Delete | Select a note, connection or group, press `Delete` |
| Pan | Drag the background |
| Zoom | Scroll, or the toolbar buttons |
| Frame everything | **Fit** |

Connections are cubic bezier curves that leave each anchor perpendicular to its
side, which is what gives them their shape, and the target side is chosen
automatically from the relative position of the two notes.

## Tabs

Product Architecture · Market Research Frame · Messaging Framework ·
Positioning Document · Growth Strategy · Channel Strategy · Content Strategy ·
Document Gallery

Each holds an independent canvas. The count beside each tab is its note count.

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
