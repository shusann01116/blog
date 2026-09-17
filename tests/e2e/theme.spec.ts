import { expect, test } from "@playwright/test";

test("テーマを再読み込み後も維持する", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");

  await page.getByRole("button", { name: "テーマを切り替え" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
});

test("保存テーマがなければ OS の設定を初期表示に使う", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");

  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
});

test("storage を利用できない場合も OS の設定で表示する", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Storage denied", "SecurityError");
      },
    });
  });

  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.getByRole("button", { name: "テーマを切り替え" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1280, height: 900 },
]) {
  for (const path of ["/posts", "/posts/2025-05-17-2025-goals"]) {
    test(`${viewport.width}px の ${path} で横にはみ出さない`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(path);
      await expect(
        page.getByRole("navigation", { name: "メイン" }),
      ).toBeVisible();
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        )
        .toBe(true);
    });
  }
}

test("コードをコピーして結果を読み上げる", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/posts/2024-09-25-another-post");

  await page.getByRole("button", { name: "コードをコピー" }).first().click();
  await expect(page.getByRole("status").first()).toHaveText(
    "コードをコピーしました",
  );
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain('"runtimeExecutable": "sh"');
});

test("コードのコピーに失敗した結果を読み上げる", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: () => Promise.reject(new Error("Clipboard denied")),
      },
    });
  });
  await page.goto("/posts/2024-09-25-another-post");

  await page.getByRole("button", { name: "コードをコピー" }).first().click();
  await expect(page.getByRole("status").first()).toHaveText(
    "コードをコピーできませんでした",
  );
});
