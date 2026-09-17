import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const normalizedDates: Readonly<Record<string, string>> = {
  "2024-09-21-first-post": "2024-09-21",
  "2024-09-25-another-post": "2024-09-25",
  "2025-03-08": "2025-03-08",
  "2025-05-17-2025-goals": "2025-05-17",
  "2025-08-26": "2025-08-26",
  "2026-03-14": "2026-03-14",
};

interface ConvertContentOptions {
  sourceRoot?: string;
  outputRoot?: string;
}

export async function convertContent({
  sourceRoot = path.resolve("src/app"),
  outputRoot = path.resolve("src/content"),
}: ConvertContentOptions = {}): Promise<void> {
  const postsRoot = path.join(sourceRoot, "posts");
  const entries = (await readdir(postsRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .toSorted((left, right) => left.name.localeCompare(right.name));

  const convertedPosts = await Promise.all(
    entries.map(async ({ name: slug }) => {
      const date = normalizedDates[slug];
      if (date === undefined) {
        throw new Error(`No normalized date configured for ${slug}`);
      }

      const sourcePath = path.join(postsRoot, slug, "page.mdx");
      const source = await readFile(sourcePath, "utf8");
      const dateLines = source.match(/^date:.*$/gm);
      if (dateLines?.length !== 1) {
        throw new Error(`${sourcePath}: expected exactly one date field`);
      }

      return {
        outputPath: path.join(outputRoot, "posts", `${slug}.mdx`),
        source: source.replace(/^date:.*$/m, `date: "${date}"`),
      };
    }),
  );

  if (convertedPosts.length !== Object.keys(normalizedDates).length) {
    throw new Error("Source posts do not match the normalized date table");
  }

  const home = await readFile(path.join(sourceRoot, "page.mdx"), "utf8");
  await mkdir(path.join(outputRoot, "posts"), { recursive: true });
  await Promise.all([
    writeFile(path.join(outputRoot, "home.mdx"), home),
    ...convertedPosts.map(({ outputPath, source }) =>
      writeFile(outputPath, source),
    ),
  ]);
}

const entryPath = process.argv[1];
if (
  entryPath !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(entryPath)).href
) {
  await convertContent();
}
