import { mkdtemp, readFile, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import matter from "gray-matter";
import { afterEach, expect, test } from "vitest";

import { buildContent } from "../../scripts/content/build";
import { watchContent } from "../../scripts/content/vite-plugin";
import { convertContent } from "../../scripts/migration/convert-content";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true })),
  );
});

async function temporaryRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "blog-content-"));
  roots.push(root);
  return root;
}

test("本文と日付以外の frontmatter を変更せずに移植する", async () => {
  const outputRoot = await temporaryRoot();
  await convertContent({
    sourceRoot: path.resolve("src/app"),
    outputRoot,
  });

  expect(await readFile(path.join(outputRoot, "home.mdx"), "utf8")).toBe(
    await readFile("src/app/page.mdx", "utf8"),
  );

  const dates: Record<string, string> = {
    "2024-09-21-first-post": "2024-09-21",
    "2024-09-25-another-post": "2024-09-25",
    "2025-03-08": "2025-03-08",
    "2025-05-17-2025-goals": "2025-05-17",
    "2025-08-26": "2025-08-26",
    "2026-03-14": "2026-03-14",
  };

  await Promise.all(
    Object.entries(dates).map(async ([slug, date]) => {
      const source = await readFile(`src/app/posts/${slug}/page.mdx`, "utf8");
      const converted = await readFile(
        path.join(outputRoot, "posts", `${slug}.mdx`),
        "utf8",
      );
      expect(converted).toBe(source.replace(/^date:.*$/m, `date: "${date}"`));
      expect(matter(converted).data.date).toBe(date);
    }),
  );
});

test("決定的なメタデータ、lazy loader、URL 一覧を生成する", async () => {
  const root = await temporaryRoot();
  const contentRoot = path.join(root, "content");
  const generatedRoot = path.join(root, "generated");
  await writeFile(
    path.join(root, "fixture.mdx"),
    '---\ntitle: B\ndate: "2024-01-02"\ndescription: desc\ntags: ["C++", blog]\nauthor: author\n---\n\n本文',
  );
  await writeFile(
    path.join(root, "fixture-a.mdx"),
    '---\ntitle: A\ndate: "2024-01-02"\ndescription: desc\ntags: [blog]\nauthor: author\n---\n\n本文',
  );
  const { mkdir, copyFile } = await import("node:fs/promises");
  await mkdir(path.join(contentRoot, "posts"), { recursive: true });
  await copyFile(
    path.join(root, "fixture.mdx"),
    path.join(contentRoot, "posts", "b.mdx"),
  );
  await copyFile(
    path.join(root, "fixture-a.mdx"),
    path.join(contentRoot, "posts", "a.mdx"),
  );

  await buildContent({ contentRoot, generatedRoot });
  const posts = await readFile(path.join(generatedRoot, "posts.ts"), "utf8");
  const loaders = await readFile(
    path.join(generatedRoot, "post-loaders.ts"),
    "utf8",
  );
  const pages = JSON.parse(
    await readFile(path.join(generatedRoot, "pages.json"), "utf8"),
  );

  expect(posts.indexOf('"slug": "a"')).toBeLessThan(
    posts.indexOf('"slug": "b"'),
  );
  expect(posts).toMatch(/"readingMinutes": 1/);
  expect(loaders).toContain('"a": () => import("../content/posts/a.mdx")');
  expect(loaders).not.toContain("import A");
  expect(pages).toEqual([
    { path: "/" },
    { path: "/posts" },
    { path: "/posts/a" },
    { path: "/posts/b" },
    { path: "/tags/C%2B%2B" },
    { path: "/tags/blog" },
  ]);

  await buildContent({ contentRoot, generatedRoot });
  expect(await readFile(path.join(generatedRoot, "posts.ts"), "utf8")).toBe(
    posts,
  );
});

test("削除した記事を全生成物から取り除く", async () => {
  const root = await temporaryRoot();
  const contentRoot = path.join(root, "content");
  const generatedRoot = path.join(root, "generated");
  const { mkdir } = await import("node:fs/promises");
  await mkdir(path.join(contentRoot, "posts"), { recursive: true });
  const postPath = path.join(contentRoot, "posts", "removed.mdx");
  await writeFile(
    postPath,
    '---\ntitle: Removed\ndate: "2024-01-01"\ndescription: desc\ntags: [stale]\nauthor: author\n---\n\n本文',
  );
  await buildContent({ contentRoot, generatedRoot });
  await unlink(postPath);
  await buildContent({ contentRoot, generatedRoot });

  await Promise.all(
    ["posts.ts", "post-loaders.ts", "pages.json"].map(async (file) => {
      const generated = await readFile(path.join(generatedRoot, file), "utf8");
      expect(generated).not.toContain("removed");
      expect(generated).not.toContain("stale");
    }),
  );
});

test("重複 slug を拒否し、生成済みファイルを更新しない", async () => {
  const root = await temporaryRoot();
  const contentRoot = path.join(root, "content");
  const generatedRoot = path.join(root, "generated");
  const { mkdir } = await import("node:fs/promises");
  await mkdir(path.join(contentRoot, "posts"), { recursive: true });
  const source =
    '---\ntitle: Post\ndate: "2024-01-01"\ndescription: desc\ntags: [blog]\nauthor: author\n---\n\n本文';
  await writeFile(path.join(contentRoot, "posts", "same.mdx"), source);
  await buildContent({ contentRoot, generatedRoot });
  const before = await readFile(path.join(generatedRoot, "posts.ts"), "utf8");

  await expect(
    buildContent({
      contentRoot,
      generatedRoot,
      postPaths: [
        path.join(contentRoot, "posts", "same.mdx"),
        path.join(contentRoot, "posts", "same.mdx"),
      ],
    }),
  ).rejects.toThrow(/duplicate slug.*same/i);
  expect(await readFile(path.join(generatedRoot, "posts.ts"), "utf8")).toBe(
    before,
  );
});

test("壊れた YAML のエラーに元ファイルを含める", async () => {
  const root = await temporaryRoot();
  const contentRoot = path.join(root, "content");
  const generatedRoot = path.join(root, "generated");
  const { mkdir } = await import("node:fs/promises");
  await mkdir(path.join(contentRoot, "posts"), { recursive: true });
  const postPath = path.join(contentRoot, "posts", "broken.mdx");
  await writeFile(
    postPath,
    '---\ntitle: Broken\ndate: "2024-01-01"\ndescription: desc\ntags: [blog\nauthor: author\n---\n',
  );

  await expect(buildContent({ contentRoot, generatedRoot })).rejects.toThrow(
    postPath,
  );
});

test("監視中の生成失敗を通知し、次の変更で回復する", async () => {
  const root = await temporaryRoot();
  const contentRoot = path.join(root, "content");
  const generatedRoot = path.join(root, "generated");
  const { mkdir } = await import("node:fs/promises");
  await mkdir(path.join(contentRoot, "posts"), { recursive: true });
  const postPath = path.join(contentRoot, "posts", "recover.mdx");
  await writeFile(postPath, "---\ntags: [broken\n---\n");

  type Message =
    { type: "full-reload" } | { type: "error"; err: { message: string } };
  let listener: ((event: string, changedPath: string) => void) | undefined;
  let resolveMessage: ((message: Message) => void) | undefined;
  const nextMessage = () =>
    new Promise<Message>((resolve) => {
      resolveMessage = resolve;
    });

  watchContent({
    contentRoot,
    generatedRoot,
    onAll: (registered) => {
      listener = registered;
    },
    send: (message) => {
      resolveMessage?.(message);
      resolveMessage = undefined;
    },
  });
  if (listener === undefined)
    throw new Error("watch listener was not registered");

  const errorMessage = nextMessage();
  listener("change", postPath);
  await expect(errorMessage).resolves.toMatchObject({
    type: "error",
    err: { message: expect.stringContaining(postPath) },
  });

  await writeFile(
    postPath,
    '---\ntitle: Recovered\ndate: "2024-01-01"\ndescription: desc\ntags: [blog]\nauthor: author\n---\n\n本文',
  );
  const reloadMessage = nextMessage();
  listener("change", postPath);
  await expect(reloadMessage).resolves.toEqual({ type: "full-reload" });
  expect(
    await readFile(path.join(generatedRoot, "posts.ts"), "utf8"),
  ).toContain('"slug": "recover"');
});
