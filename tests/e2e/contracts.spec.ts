import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, test } from "@playwright/test";
import { load } from "cheerio";

import {
  discoverPostSlugs,
  snapshotHtml,
} from "../../scripts/migration/capture-baseline";
import baseline from "../fixtures/migration/baseline.json" with { type: "json" };

function rssSnapshot(xml: string) {
  const $ = load(xml, { xmlMode: true });
  const channel = $("rss > channel").first();

  return {
    title: channel.children("title").first().text(),
    link: channel.children("link").first().text(),
    description: channel.children("description").first().text(),
    language: channel.children("language").first().text(),
    items: channel
      .children("item")
      .toArray()
      .map((item) => ({
        title: $(item).children("title").text(),
        description: $(item).children("description").text(),
        link: $(item).children("link").text(),
        pubDate: $(item).children("pubDate").text(),
      })),
  };
}

function mimeEssence(contentType: string | null | undefined) {
  return contentType?.split(";", 1)[0]?.trim().toLowerCase() ?? null;
}

test("document title excludes SVG accessibility titles", () => {
  const snapshot = snapshotHtml(
    "/example",
    200,
    null,
    "<html><head><title>Document title</title></head><body><svg><title>Icon title</title></svg></body></html>",
  );

  expect(snapshot.title).toBe("Document title");
});

test("post discovery ignores support directories without page.mdx", async () => {
  const postsDirectory = await mkdtemp(join(tmpdir(), "blog-posts-"));

  try {
    await mkdir(join(postsDirectory, "published-post"));
    await writeFile(
      join(postsDirectory, "published-post", "page.mdx"),
      "# Post",
    );
    await mkdir(join(postsDirectory, "support-files"));

    await expect(discoverPostSlugs(postsDirectory)).resolves.toEqual([
      "published-post",
    ]);
  } finally {
    await rm(postsDirectory, { recursive: true, force: true });
  }
});

test("post discovery reports filesystem failures", async () => {
  const postsDirectory = await mkdtemp(join(tmpdir(), "blog-posts-"));
  const postDirectory = join(postsDirectory, "unreadable-post");

  try {
    await mkdir(postDirectory);
    await symlink("page.mdx", join(postDirectory, "page.mdx"));

    await expect(discoverPostSlugs(postsDirectory)).rejects.toMatchObject({
      code: "ELOOP",
    });
  } finally {
    await rm(postsDirectory, { recursive: true, force: true });
  }
});

for (const expected of baseline.pages) {
  test(`公開レスポンスを維持する: ${expected.path}`, async ({ request }) => {
    const response = await request.get(expected.path, { maxRedirects: 0 });
    const actual = snapshotHtml(
      expected.path,
      response.status(),
      response.headers()["location"] ?? null,
      await response.text(),
    );

    expect(actual).toEqual(expected);
  });
}

for (const expected of baseline.posts) {
  test(`記事メタデータを維持する: ${expected.slug}`, async ({ request }) => {
    const response = await request.get(`/posts/${expected.slug}`);
    const $ = load(await response.text());
    const byline = $("time[datetime]").first().parent().text();

    expect({
      slug: expected.slug,
      title: $("head > title").first().text(),
      date: $("time[datetime]").first().attr("datetime"),
      tags: $('a[href^="/tags/"]')
        .toArray()
        .map((node) => $(node).text().trim()),
      author: byline.split(",", 1)[0],
      description: $('meta[name="description"]').attr("content"),
    }).toEqual(expected);
  });
}

test("RSS を維持する", async ({ request }) => {
  const response = await request.get(baseline.rss.path, { maxRedirects: 0 });

  const actualBody = await response.text();

  expect({
    path: baseline.rss.path,
    status: response.status(),
    location: response.headers()["location"] ?? null,
    contentType: mimeEssence(response.headers()["content-type"]),
    body: rssSnapshot(actualBody),
  }).toEqual({
    path: baseline.rss.path,
    status: baseline.rss.status,
    location: baseline.rss.location,
    contentType: mimeEssence(baseline.rss.contentType),
    body: rssSnapshot(baseline.rss.body),
  });
});

test("不明記事は HTTP 404", async ({ request }) => {
  expect((await request.get("/posts/not-a-post")).status()).toBe(404);
});

test("不明タグは空一覧", async ({ page }) => {
  const response = await page.goto("/tags/not-a-tag");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "not-a-tag",
  );
});

test("画像、フォント、Pagefind の公開アセットを取得できる", async ({
  request,
}) => {
  const image = await request.get("/imgs/lgtmoon-rs.png");
  expect(image.status()).toBe(200);
  expect(mimeEssence(image.headers()["content-type"])).toBe("image/png");

  const home = await request.get("/");
  const $ = load(await home.text());
  const stylesheetPath = $('link[rel="stylesheet"]').attr("href");
  expect(stylesheetPath).toMatch(/^\/assets\/[^/]+\.css$/);

  const stylesheet = await request.get(stylesheetPath!);
  expect(stylesheet.status()).toBe(200);
  expect(mimeEssence(stylesheet.headers()["content-type"])).toBe("text/css");
  const fontPath = (await stylesheet.text()).match(
    /url\((\/assets\/noto-sans-jp-[^)]+\.woff2)\)/,
  )?.[1];
  expect(fontPath).toBeDefined();

  const font = await request.get(fontPath!);
  expect(font.status()).toBe(200);
  expect(mimeEssence(font.headers()["content-type"])).toBe("font/woff2");

  const pagefindResponses = await Promise.all(
    ["/_pagefind/pagefind.js", "/_pagefind/pagefind-entry.json"].map((path) =>
      request.get(path),
    ),
  );
  expect(pagefindResponses.every((response) => response.status() === 200)).toBe(
    true,
  );
});

test("Pagefind の分割索引と記事フラグメントを取得できる", async ({ page }) => {
  const shardResponses: { path: string; status: number }[] = [];
  page.on("response", (response) => {
    const path = new URL(response.url()).pathname;
    if (
      /\/_pagefind\/(?:index|fragment)\/[^/]+\.pf_(?:index|fragment)$/.test(
        path,
      )
    ) {
      shardResponses.push({ path, status: response.status() });
    }
  });

  await page.goto("/");
  await page.getByRole("button", { name: "検索", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "記事を検索" })
    .fill("ヒューリスティック");
  await expect(
    page.getByRole("link", { name: "ヒューリスティックをコントロールしたい" }),
  ).toBeVisible();

  expect(shardResponses.some(({ path }) => path.includes("/index/"))).toBe(
    true,
  );
  expect(shardResponses.some(({ path }) => path.includes("/fragment/"))).toBe(
    true,
  );
  expect(shardResponses.every(({ status }) => status === 200)).toBe(true);
});
