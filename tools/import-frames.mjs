/**
 * Pulls the Frames folder out of the Obsidian vault into frames.json, which the
 * app fetches at runtime.
 *
 * The frames are reference material, and several of them carry a note saying
 * no AI may write to them, so this only ever reads. Re-run it after editing
 * the frames in Obsidian.
 *
 *   node tools/import-frames.mjs
 *   node tools/import-frames.mjs "D:\\path\\to\\vault\\Frames"
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, extname, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "frames.json");

const DEFAULT_VAULT = join(homedir(), "OneDrive", "Documents", "Obsidian Vault", "Frames");
const SRC = process.argv[2] || DEFAULT_VAULT;

/* Step 1..5 lead; everything else follows alphabetically. */
function orderKey(name) {
  const m = name.match(/^Step\s+(\d+)/i);
  return m ? [0, Number(m[1]), name] : [1, 0, name];
}

const files = (await readdir(SRC)).filter((f) => [".canvas", ".md"].includes(extname(f).toLowerCase()));
if (!files.length) {
  console.error(`No .canvas or .md files in ${SRC}`);
  process.exit(1);
}

const frames = [];
for (const file of files) {
  const name = basename(file, extname(file));
  const raw = await readFile(join(SRC, file), "utf8");

  if (extname(file).toLowerCase() === ".md") {
    frames.push({ name, kind: "note", text: raw.trim() });
    continue;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error(`! ${file} is not valid JSON, skipping: ${e.message}`);
    continue;
  }
  const nodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
  const edges = Array.isArray(parsed.edges) ? parsed.edges : [];

  /* Obsidian embeds vault files as type "file"; there is nothing to render for
     those here, so they become a labelled placeholder rather than vanishing. */
  const cleaned = nodes.map((n) =>
    n.type === "file"
      ? { ...n, type: "text", text: `📄 ${basename(n.file || "linked file")}` }
      : n
  );

  frames.push({ name, kind: "canvas", nodes: cleaned, edges });
}

frames.sort((a, b) => {
  const [ag, an, at] = orderKey(a.name);
  const [bg, bn, bt] = orderKey(b.name);
  return ag - bg || an - bn || at.localeCompare(bt);
});

const out = {
  generatedAt: new Date().toISOString(),
  source: SRC,
  frames
};
await writeFile(OUT, JSON.stringify(out, null, 1), "utf8");

const cards = frames.reduce((n, f) => n + (f.nodes ? f.nodes.length : 0), 0);
const wires = frames.reduce((n, f) => n + (f.edges ? f.edges.length : 0), 0);
console.log(`${frames.length} frames -> frames.json  (${cards} cards, ${wires} connections)`);
for (const f of frames) {
  console.log(
    `  ${f.kind === "note" ? "note  " : "canvas"}  ${f.name}` +
      (f.kind === "canvas" ? `  (${f.nodes.length} cards, ${f.edges.length} wires)` : "")
  );
}
