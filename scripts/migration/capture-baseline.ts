import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { load } from "cheerio";

type PageSnapshot = {
  path: string;
  status: number;
  location: string | null;
  title: string;
  description: string | null;
  canonical: string | null;
  og: Record<string, string>;
  headingIds: string[];
};

type PostSnapshot = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  author: string;
  description: string;
};

const EXTRA_DOCUMENT_PATHS = [
  "/",
  "/posts",
  "/tags/blog",
  "/tags/book",
  "/tags/not-a-tag",
  "/posts/not-a-post",
  "/not-a-route",
];

const RESOURCE_PATHS = [
  "/rss.xml",
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico",
  "/imgs/lgtmoon-rs.png",
];

function getArguments(argv: string[]) {
  const originIndex = argv.indexOf("--origin");
  const outputIndex = argv.indexOf("--output");
  const origin = argv[originIndex + 1];
  const output = argv[outputIndex + 1];

  if (originIndex === -1 || outputIndex === -1 || !origin || !output) {
    throw new Error(
      "Usage: capture-baseline.ts --origin <URL> --output <file>",
    );
  }

  return { origin: new URL(origin), output };
}

export async function discoverPostSlugs(
  postsDirectory = resolve("src/app/posts"),
) {
  const entries = await readdir(postsDirectory, {
    withFileTypes: true,
  });

  const candidates = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        try {
          const page = await stat(
            resolve(postsDirectory, entry.name, "page.mdx"),
          );
          return page.isFile() ? entry.name : null;
        } catch {
          return null;
        }
      }),
  );

  return candidates.filter((slug): slug is string => slug !== null).toSorted();
}

function addDocumentVariants(paths: string[]) {
  return paths.flatMap((path) => {
    const variants = [path];
    if (path !== "/") variants.push(`${path}/`);
    variants.push(`${path}?q=test`);
    return variants;
  });
}

async function fetchSnapshot(origin: URL, path: string) {
  const response = await fetch(new URL(path, origin), { redirect: "manual" });
  const body = await response.text();
  return { response, body };
}

export function snapshotHtml(
  path: string,
  status: number,
  location: string | null,
  html: string,
): PageSnapshot {
  const $ = load(html);
  const og = Object.fromEntries(
    $('meta[property^="og:"]')
      .toArray()
      .flatMap((node) => {
        const property = $(node).attr("property");
        const content = $(node).attr("content");
        return property && content !== undefined ? [[property, content]] : [];
      }),
  );

  return {
    path,
    status,
    location,
    title: $("head > title").first().text(),
    description: $('meta[name="description"]').attr("content") ?? null,
    canonical: $('link[rel="canonical"]').attr("href") ?? null,
    og,
    headingIds: $("h1[id],h2[id],h3[id],h4[id]")
      .toArray()
      .flatMap((node) => $(node).attr("id") ?? []),
  };
}

async function capturePost(origin: URL, slug: string): Promise<PostSnapshot> {
  const { response, body } = await fetchSnapshot(origin, `/posts/${slug}`);
  if (!response.ok) {
    throw new Error(`Failed to capture post ${slug}: HTTP ${response.status}`);
  }

  const $ = load(body);
  const date = $("time[datetime]").first().attr("datetime");
  const description = $('meta[name="description"]').attr("content");
  const byline = $("time[datetime]").first().parent().text();
  const author = byline.split(",", 1)[0];

  if (!date || description === undefined || !author) {
    throw new Error(`Post ${slug} is missing public metadata`);
  }

  return {
    slug,
    title: $("head > title").first().text(),
    date,
    tags: $("a.nextra-tag")
      .toArray()
      .map((node) => $(node).text()),
    author,
    description,
  };
}

async function captureBaseline(origin: URL) {
  const slugs = await discoverPostSlugs();
  const documentPaths = [
    ...EXTRA_DOCUMENT_PATHS,
    ...slugs.map((slug) => `/posts/${slug}`),
  ];
  const paths = [...addDocumentVariants(documentPaths), ...RESOURCE_PATHS];
  const pages = await Promise.all(
    paths.map(async (path) => {
      const { response, body } = await fetchSnapshot(origin, path);
      return snapshotHtml(
        path,
        response.status,
        response.headers.get("location"),
        body,
      );
    }),
  );
  const posts = await Promise.all(
    slugs.map((slug) => capturePost(origin, slug)),
  );
  const { response: rssResponse, body: rssBody } = await fetchSnapshot(
    origin,
    "/rss.xml",
  );

  return {
    pages,
    posts,
    rss: {
      path: "/rss.xml",
      status: rssResponse.status,
      location: rssResponse.headers.get("location"),
      contentType: rssResponse.headers.get("content-type"),
      body: rssBody,
    },
  };
}

async function main() {
  const { origin, output } = getArguments(process.argv.slice(2));
  const baseline = await captureBaseline(origin);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(baseline, null, 2)}\n`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main();
}
