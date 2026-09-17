import { expect, test } from "@playwright/test";

const pagefindModulePattern = /\/_pagefind\/pagefind\.js(?:\?.*)?$/;

test("Pagefind は検索を始めるまで読み込まない", async ({ page }) => {
  const moduleRequests: string[] = [];
  page.on("request", (request) => {
    if (pagefindModulePattern.test(request.url())) {
      moduleRequests.push(request.url());
    }
  });

  await page.goto("/");
  expect(moduleRequests).toEqual([]);

  await page.getByRole("button", { name: "検索", exact: true }).click();
  expect(moduleRequests).toEqual([]);

  await page
    .getByRole("searchbox", { name: "記事を検索" })
    .fill("ヒューリスティック");
  await expect.poll(() => moduleRequests.length).toBe(1);
});

test("日本語検索から記事へ移動する", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "検索", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "記事を検索" })
    .fill("ヒューリスティック");
  const result = page
    .getByRole("dialog")
    .getByRole("link", { name: "ヒューリスティックをコントロールしたい" });
  await expect(result).toBeVisible();
  await result.click();
  await expect(page).toHaveURL(/\/posts\/2026-03-14$/);
});

test("空欄と0件を区別して表示する", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "検索", exact: true }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("検索語を入力してください")).toBeVisible();
  await dialog.getByRole("searchbox", { name: "記事を検索" }).fill("龘龘龘");
  await expect(dialog.getByText("記事が見つかりませんでした")).toBeVisible();
});

test("モジュール取得の失敗後にネットワークから再試行できる", async ({
  page,
}) => {
  let aborted = false;
  await page.route(pagefindModulePattern, async (route) => {
    if (!aborted) {
      aborted = true;
      await route.abort("failed");
      return;
    }
    await route.continue();
  });

  await page.goto("/");
  await page.getByRole("button", { name: "検索", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("searchbox", { name: "記事を検索" })
    .fill("ヒューリスティック");

  await expect(dialog.getByText("検索を読み込めませんでした")).toBeVisible();
  await dialog.getByRole("button", { name: "再試行" }).click();
  await expect(
    dialog.getByRole("link", {
      name: "ヒューリスティックをコントロールしたい",
    }),
  ).toBeVisible();
});

test("記事フラグメント取得の失敗後に新しい Pagefind で再試行できる", async ({
  page,
}) => {
  let fragmentRequests = 0;
  await page.route(/\/_pagefind\/fragment\/.*\.pf_fragment$/, async (route) => {
    fragmentRequests += 1;
    if (fragmentRequests === 1) {
      await route.abort("failed");
      return;
    }
    await route.continue();
  });

  await page.goto("/");
  await page.getByRole("button", { name: "検索", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("searchbox", { name: "記事を検索" })
    .fill("ヒューリスティック");

  await expect(dialog.getByText("検索を読み込めませんでした")).toBeVisible();
  await dialog.getByRole("button", { name: "再試行" }).click();
  await expect(
    dialog.getByRole("link", {
      name: "ヒューリスティックをコントロールしたい",
    }),
  ).toBeVisible();
  expect(fragmentRequests).toBe(2);
});

test("Escape で閉じると検索ボタンへフォーカスが戻る", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "検索", exact: true });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(trigger).toBeFocused();
});
