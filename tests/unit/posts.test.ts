import { describe, expect, test } from "vitest";

import { parseFrontmatter, validateDate } from "../../src/lib/post-schema";
import {
  countTags,
  getPost,
  getPosts,
  getPostsByTag,
  sortPosts,
} from "../../src/lib/posts";
import type { PostMeta } from "../../src/lib/post-types";

function makePost(slug: string, date: string): PostMeta {
  return {
    slug,
    date,
    title: slug,
    description: slug,
    tags: ["blog"],
    author: "author",
    readingMinutes: 1,
  };
}

test.each(["2024-09-21", "2024-02-29"])("日付を維持する: %s", (value) => {
  expect(validateDate(value)).toBe(value);
});

test.each([
  ["2024/09/21", /date must be YYYY-MM-DD/],
  ["2025-02-29", /invalid calendar date/],
  ["2025-13-01", /invalid calendar date/],
  ["", /date must be YYYY-MM-DD/],
  [new Date("2024-09-21"), /date must be YYYY-MM-DD/],
] as const)("不正日付を拒否する: %s", (value, message) => {
  expect(() => validateDate(value)).toThrow(message);
});

describe("parseFrontmatter", () => {
  const valid = {
    title: "記事",
    date: "2024-09-21",
    description: "説明",
    tags: ["blog"],
    author: "author",
  };

  test.each(["title", "description", "author"] as const)(
    "空の %s を元ファイル付きで拒否する",
    (key) => {
      expect(() =>
        parseFrontmatter({ ...valid, [key]: "" }, "content/broken.mdx"),
      ).toThrow(/content\/broken\.mdx/);
    },
  );

  test.each([[], ["blog", ""], ["blog", 1], "blog"])(
    "不正な tags を拒否する: %j",
    (tags) => {
      expect(() =>
        parseFrontmatter({ ...valid, tags }, "content/broken.mdx"),
      ).toThrow(/content\/broken\.mdx/);
    },
  );
});

test("日付降順、同日 slug 順で並べる", () => {
  expect(
    sortPosts([
      makePost("z", "2024-01-01"),
      makePost("b", "2025-01-01"),
      makePost("a", "2025-01-01"),
    ]).map(({ slug }) => slug),
  ).toEqual(["a", "b", "z"]);
});

test("タグごとの記事数を数える", () => {
  const posts: PostMeta[] = Array.from({ length: 5 }, (_, index) => ({
    slug: `blog-${index}`,
    title: "記事",
    date: "2024-01-01",
    description: "説明",
    tags: index === 0 ? ["blog", "book"] : ["blog"],
    author: "author",
    readingMinutes: 1,
  }));

  expect(countTags(posts)).toEqual({ blog: 5, book: 1 });
});

test("オブジェクトの組み込み名もタグとして数える", () => {
  const post = makePost("reserved-tags", "2024-01-01");
  post.tags = ["constructor", "__proto__", "constructor"];

  const counts = countTags([post]);

  expect(Object.hasOwn(counts, "constructor")).toBe(true);
  expect(counts["constructor"]).toBe(2);
  expect(Object.hasOwn(counts, "__proto__")).toBe(true);
  expect(counts["__proto__"]).toBe(1);
});

test("移植した全記事のタグ件数と読了時間を公開する", () => {
  const posts = getPosts();

  expect(countTags(posts)).toEqual({ blog: 5, book: 1 });
  expect(posts).toHaveLength(6);
  expect(
    posts.every(
      ({ readingMinutes }) =>
        Number.isFinite(readingMinutes) &&
        Number.isInteger(readingMinutes) &&
        readingMinutes > 0,
    ),
  ).toBe(true);
});

test("slug とタグから移植済み記事を検索する", () => {
  expect(getPost("2024-09-21-first-post")?.title).toBe("はじめてのPost");
  expect(getPost("missing")).toBeUndefined();
  expect(getPostsByTag("book").map(({ slug }) => slug)).toEqual(["2025-08-26"]);
  expect(getPostsByTag("missing")).toEqual([]);
});
