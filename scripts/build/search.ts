import { spawnSync } from "node:child_process";
import { access, readFile, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

const assetRoot = resolve("dist/client");
const generatedPagesPath = resolve("src/generated/pages.json");
const outputPath = join(assetRoot, "_pagefind");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPage(value: unknown): value is { path: string } {
  return isRecord(value) && typeof value.path === "string";
}

if (
  assetRoot !== resolve("dist/client") ||
  assetRoot === resolve("public") ||
  assetRoot.startsWith(resolve(".next"))
) {
  throw new Error(`Refusing to index unexpected asset root: ${assetRoot}`);
}

const parsedPages: unknown = JSON.parse(
  await readFile(generatedPagesPath, "utf8"),
);
if (!Array.isArray(parsedPages) || !parsedPages.every(isPage)) {
  throw new Error(`Invalid generated pages: ${generatedPagesPath}`);
}
const pages = parsedPages;
const articlePages = pages.filter(({ path }) => path.startsWith("/posts/"));

function htmlPath(pathname: string): string {
  return pathname === "/"
    ? join(assetRoot, "index.html")
    : join(assetRoot, `${pathname.slice(1)}.html`);
}

await Promise.all(
  pages.map(async ({ path }) => {
    const pathToHtml = htmlPath(path);
    await access(pathToHtml);
    if (path.startsWith("/posts/")) {
      const html = await readFile(pathToHtml, "utf8");
      if (!html.includes("data-pagefind-body")) {
        throw new Error(`Article is missing data-pagefind-body: ${pathToHtml}`);
      }
    }
  }),
);

await rm(outputPath, { force: true, recursive: true });

const result = spawnSync(
  "pnpm",
  ["exec", "pagefind", "--site", assetRoot, "--output-path", outputPath],
  { stdio: "inherit" },
);
if (result.status !== 0) throw new Error("Pagefind indexing failed");

await access(join(outputPath, "pagefind.js"));
const entry: unknown = JSON.parse(
  await readFile(join(outputPath, "pagefind-entry.json"), "utf8"),
);
if (!isRecord(entry) || !isRecord(entry.languages)) {
  throw new Error("Pagefind emitted an invalid entry manifest");
}
let indexedPages = 0;
for (const language of Object.values(entry.languages)) {
  if (!isRecord(language) || typeof language.page_count !== "number") {
    throw new Error("Pagefind emitted an invalid language manifest");
  }
  indexedPages += language.page_count;
}
if (indexedPages !== articlePages.length) {
  throw new Error(
    `Expected ${articlePages.length} indexed articles, received ${indexedPages}`,
  );
}

console.log(
  `Verified ${pages.length} prerendered pages and indexed ${indexedPages} articles`,
);
