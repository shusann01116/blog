import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const output = "out";
const read = (path) => readFileSync(join(output, path), "utf8");
const files = readdirSync(output, { recursive: true, encoding: "utf8" }).filter(
  (file) => file.endsWith(".html"),
);
assert(files.length > 0, "Run pnpm build before checking the static export");
for (const required of [
  "index.html",
  "posts.html",
  "404.html",
  "rss.xml",
  "_pagefind/pagefind.js",
  "_pagefind/pagefind-entry.json",
]) {
  assert(
    existsSync(join(output, required)),
    `Missing exported file: ${required}`,
  );
}

const posts = readdirSync("src/app/posts", { withFileTypes: true })
  .filter(
    (entry) =>
      entry.isDirectory() &&
      existsSync(join("src/app/posts", entry.name, "page.mdx")),
  )
  .map((entry) => entry.name);
const rss = read("rss.xml");
assert.equal(
  (rss.match(/<item>/g) ?? []).length,
  posts.length,
  "RSS must contain every post",
);
for (const post of posts) {
  assert(
    existsSync(join(output, "posts", `${post}.html`)),
    `Missing post: ${post}`,
  );
  assert(
    rss.includes(`/posts/${post}</link>`),
    `Post absent from RSS: ${post}`,
  );
}

// Check all root-relative navigation and assets against the deployable directory.
// This also checks generated tag links without hardcoding the current tags.
let checked = 0;
for (const file of files) {
  const html = read(file);
  assert(!html.includes("/_next/image?"), `Runtime image optimizer in ${file}`);
  for (const [, reference] of html.matchAll(/(?:href|src)="(\/[^"<>]*)"/g)) {
    if (reference.startsWith("//")) continue;
    const path = decodeURIComponent(
      new URL(reference.replaceAll("&amp;", "&"), "https://static.invalid")
        .pathname,
    );
    const relative = path.replace(/^\//, "");
    const candidates = [
      relative,
      `${relative}.html`,
      join(relative, "index.html"),
    ];
    assert(
      candidates.some((candidate) => existsSync(join(output, candidate))),
      `Broken static reference in ${file}: ${reference}`,
    );
    checked++;
  }
}
const index = JSON.parse(read("_pagefind/pagefind-entry.json"));
assert(
  Object.values(index.languages).some(
    (language) => language.page_count >= posts.length,
  ),
  "Search index must include at least all posts",
);
console.log(
  `Static export verified: ${posts.length} posts, ${files.length} HTML files, RSS, search index, and ${checked} local references.`,
);
