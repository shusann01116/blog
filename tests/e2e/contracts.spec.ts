import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, test } from "@playwright/test";
import { load } from "cheerio";

import {
  discoverPostSlugs,
  snapshotHtml,
} from "../../scripts/migration/capture-baseline";
import baseline from "../fixtures/migration/baseline.json" with { type: "json" };

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
      tags: $("a.nextra-tag")
        .toArray()
        .map((node) => $(node).text()),
      author: byline.split(",", 1)[0],
      description: $('meta[name="description"]').attr("content"),
    }).toEqual(expected);
  });
}

test("RSS を維持する", async ({ request }) => {
  const response = await request.get(baseline.rss.path, { maxRedirects: 0 });

  expect({
    path: baseline.rss.path,
    status: response.status(),
    location: response.headers()["location"] ?? null,
    contentType: response.headers()["content-type"] ?? null,
    body: await response.text(),
  }).toEqual(baseline.rss);
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
