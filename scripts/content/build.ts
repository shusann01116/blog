import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import matter from "gray-matter";
import readingTime from "reading-time";

import { parseFrontmatter } from "../../src/lib/post-schema.ts";
import type { PostMeta } from "../../src/lib/post-types.ts";

interface BuildContentOptions {
  contentRoot?: string;
  generatedRoot?: string;
  postPaths?: string[];
}

async function discoverPostPaths(contentRoot: string): Promise<string[]> {
  const postsRoot = path.join(contentRoot, "posts");
  return (await readdir(postsRoot, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"))
    .map((entry) => path.join(postsRoot, entry.name))
    .toSorted((left, right) => left.localeCompare(right));
}

function sortPosts(posts: readonly PostMeta[]): PostMeta[] {
  return posts.toSorted(
    (left, right) =>
      right.date.localeCompare(left.date) ||
      left.slug.localeCompare(right.slug),
  );
}

export async function buildContent({
  contentRoot = path.resolve("src/content"),
  generatedRoot = path.resolve("src/generated"),
  postPaths,
}: BuildContentOptions = {}): Promise<void> {
  const paths = postPaths ?? (await discoverPostPaths(contentRoot));
  const seen = new Set<string>();
  const posts = sortPosts(
    await Promise.all(
      paths.map(async (sourcePath) => {
        const slug = path.basename(sourcePath, ".mdx");
        if (seen.has(slug)) {
          throw new Error(`Duplicate slug: ${slug}`);
        }
        seen.add(slug);

        const source = await readFile(sourcePath, "utf8");
        const parsed = matter(source);
        const metadata = parseFrontmatter(parsed.data, sourcePath);
        const minutes = Math.max(
          1,
          Math.ceil(readingTime(parsed.content).minutes),
        );
        if (!Number.isFinite(minutes)) {
          throw new Error(`${sourcePath}: reading time must be finite`);
        }

        return {
          slug,
          title: metadata.title,
          date: metadata.date,
          description: metadata.description,
          tags: metadata.tags,
          author: metadata.author,
          readingMinutes: minutes,
        };
      }),
    ),
  );

  const postSource = [
    'import type { PostMeta } from "../lib/post-types";',
    "",
    `export const posts = ${JSON.stringify(posts, null, 2)} satisfies readonly PostMeta[];`,
    "",
  ].join("\n");
  const loaders = posts
    .map(
      ({ slug }) =>
        `  ${JSON.stringify(slug)}: () => import(${JSON.stringify(`../content/posts/${slug}.mdx`)}),`,
    )
    .join("\n");
  const loaderSource = `export const postLoaders = {\n${loaders}\n};\n`;
  const tags = [
    ...new Set(posts.flatMap(({ tags: postTags }) => postTags)),
  ].toSorted();
  const pages = [
    { path: "/" },
    { path: "/posts" },
    ...posts.map(({ slug }) => ({ path: `/posts/${slug}` })),
    ...tags.map((tag) => ({ path: `/tags/${encodeURIComponent(tag)}` })),
  ];
  const pagesSource = `${JSON.stringify(pages, null, 2)}\n`;

  await mkdir(generatedRoot, { recursive: true });
  await Promise.all([
    writeFile(path.join(generatedRoot, "posts.ts"), postSource),
    writeFile(path.join(generatedRoot, "post-loaders.ts"), loaderSource),
    writeFile(path.join(generatedRoot, "pages.json"), pagesSource),
  ]);
}

const entryPath = process.argv[1];
if (
  entryPath !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(entryPath)).href
) {
  await buildContent();
}
