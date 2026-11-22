// Runs after `next build` (static export):
// 1) Next 16 writes segment prefetch files as out/x/__next.x/__PAGE__.txt while the client
//    requests out/x/__next.x.__PAGE__.txt — create the flat copies.
// 2) Generate the service worker precache list so the PWA works fully offline.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve("out");
let flat = 0;
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (!e.isDirectory() || e.name === "_next") continue;
    if (e.name.startsWith("__next.")) flatten(p, dir, e.name);
    else walk(p);
  }
}
function flatten(segDir, parent, prefix) {
  for (const e of fs.readdirSync(segDir, { withFileTypes: true })) {
    const p = path.join(segDir, e.name);
    if (e.isDirectory()) flatten(p, parent, prefix + "." + e.name);
    else { fs.copyFileSync(p, path.join(parent, prefix + "." + e.name)); flat++; }
  }
}
walk(root);

const files = [];
function list(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) list(p);
    else files.push("/" + path.relative(root, p).split(path.sep).join("/"));
  }
}
list(root);

const pages = files
  .filter((f) => f.endsWith(".html") && !/404|_not-found/.test(f))
  .map((f) => (f === "/index.html" ? "/" : f.replace(/\.html$/, "")));
const assets = files.filter(
  (f) =>
    f.startsWith("/_next/static/") ||
    /\.(png|webmanifest)$/.test(f) ||
    (f.endsWith(".txt") && !f.includes("_not-found"))
);
const precache = [...new Set([...pages, ...assets])];
const hash = crypto.createHash("md5").update(precache.join("|") + Date.now()).digest("hex").slice(0, 10);

const swPath = path.join(root, "sw.js");
const sw = fs
  .readFileSync(swPath, "utf8")
  .replace("__VERSION__", hash)
  .replace("__PRECACHE__", JSON.stringify(precache));
fs.writeFileSync(swPath, sw);
console.log(`postbuild: flattened ${flat} segment files, precache ${precache.length} urls, sw ${hash}`);
