import { expect, test } from "@playwright/test";

test("404 は既存の status と head を保ち、ホームへの導線を表示する", async ({
  page,
}) => {
  const response = await page.goto("/not-a-route");

  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle("shusann01116's blog");
  await expect(
    page.getByRole("heading", { name: "ページが見つかりません" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "ホームへ戻る" }),
  ).toHaveAttribute("href", "/");
});

test("JavaScript 無効でも 404 の document shell と導線を表示する", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  try {
    const response = await page.goto("/not-a-route");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "ページが見つかりません" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "ホームへ戻る" }),
    ).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
  } finally {
    await context.close();
  }
});

test("記事モジュールの一時的な失敗後に再試行で本文を表示する", async ({
  page,
}) => {
  let aborted = false;
  await page.route(/\/assets\/2026-03-14-[^/]+\.js$/, async (route) => {
    if (!aborted) {
      aborted = true;
      await route.abort("failed");
      return;
    }
    await route.continue();
  });

  await page.goto("/posts");
  await page
    .getByRole("link", { name: "ヒューリスティックをコントロールしたい" })
    .click();

  await expect(
    page.getByRole("heading", { name: "ページを表示できませんでした" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "再試行" }).click();

  expect(aborted).toBe(true);
  await expect(page).toHaveURL(/\/posts\/2026-03-14$/);
  await expect(
    page.getByRole("heading", {
      name: "ヒューリスティックをコントロールしたい",
    }),
  ).toBeVisible();
  await expect(page.getByText("仕事の変化")).toBeVisible();
});

test("主要な SPA 導線で現在の title を反映し、ブラウザーエラーを出さない", async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto("/");
  await expect(page).toHaveTitle("shusann01116");
  await page.getByRole("link", { name: "Posts", exact: true }).click();
  await expect(page).toHaveTitle("Posts");
  await page
    .getByRole("link", { name: "ヒューリスティックをコントロールしたい" })
    .click();
  await expect(page).toHaveTitle("ヒューリスティックをコントロールしたい");
  await page.goBack();
  await expect(page).toHaveTitle("Posts");
  await page.getByRole("link", { name: "blog (5)" }).click();
  await expect(page).toHaveTitle("Posts Tagged with “blog”");

  expect(browserErrors).toEqual([]);
});
