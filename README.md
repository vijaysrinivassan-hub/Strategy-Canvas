# Strategy Canvas

A single-file tool that turns a written strategy report into a readable board.

- **Four columns** across the board — one per section of the report.
- **Cards** — one per bullet, click any card to read it in full on the right.
- **Chart** — an HTML `<canvas>` showing how much weight each column carries.
- **Paste a report** — drop in your own and it re-renders.

## Report format

```
# Report title

## Section name
- Card heading — the detail that shows underneath it
- Another card
```

`#` sets the title, each `##` becomes a column, each `-` becomes a card.
A long dash inside a bullet splits it into a heading and a note.

## Running it

No build step, no dependencies. Open `index.html` in a browser, or deploy the
folder as a static site.

## Deploying

Hosted on Vercel as a static site — no framework, no configuration. Every push
to `main` triggers a new deployment automatically.
