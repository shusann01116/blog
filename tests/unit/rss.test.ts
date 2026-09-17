import { expect, test } from "vitest";

import { renderRss } from "../../src/lib/rss";
import type { PostMeta } from "../../src/lib/post-types";

function makePost(overrides: Partial<PostMeta> = {}): PostMeta {
  return {
    slug: "xml-test",
    title: "A & B <C>",
    date: "2024-09-21",
    description: '"引用"',
    tags: ["blog"],
    author: "shusann01116",
    readingMinutes: 1,
    ...overrides,
  };
}

test("RSS の本文と URL を XML エスケープする", () => {
  const rss = renderRss([makePost({ slug: "a&b", description: `D > E 'F'` })]);

  expect(rss).toContain("A &amp; B &lt;C&gt;");
  expect(rss).toContain("D &gt; E &apos;F&apos;");
  expect(rss).toContain("https://blog.shusann01116.dev/posts/a&amp;b");
});

test("公開日を UTC の午前 0 時として出力し、入力順を保つ", () => {
  const rss = renderRss([
    makePost({ slug: "new", title: "New", date: "2025-08-26" }),
    makePost({ slug: "old", title: "Old", date: "2024-09-21" }),
  ]);

  expect(rss).toContain("Sat, 21 Sep 2024 00:00:00 GMT");
  expect(rss).toContain("Tue, 26 Aug 2025 00:00:00 GMT");
  expect(rss.indexOf("<title>New</title>")).toBeLessThan(
    rss.indexOf("<title>Old</title>"),
  );
});
