import { expect, test } from "@playwright/test";

const readSemanticColors = (page: import("@playwright/test").Page) =>
  page.locator("html").evaluate((root) => {
    const styles = getComputedStyle(root);
    return {
      page: styles.getPropertyValue("--page").trim(),
      surface: styles.getPropertyValue("--surface").trim(),
      text: styles.getPropertyValue("--text").trim(),
      accent: styles.getPropertyValue("--accent").trim(),
    };
  });

const readContrastRatio = (locator: import("@playwright/test").Locator) =>
  locator.evaluate((element) => {
    const styles = getComputedStyle(element);
    const [foreground, background] = [styles.color, styles.backgroundColor].map(
      (color) => {
        const [red, green, blue] = (
          color
            .match(/[\d.]+/g)
            ?.slice(0, 3)
            .map(Number) ?? []
        ).map((channel) => {
          const normalized = channel / 255;
          return normalized <= 0.04045
            ? normalized / 12.92
            : ((normalized + 0.055) / 1.055) ** 2.4;
        });

        return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
      },
    );

    return (
      (Math.max(foreground, background) + 0.05) /
      (Math.min(foreground, background) + 0.05)
    );
  });

test("semantic color tokens follow the active theme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");

  await expect
    .poll(() => readSemanticColors(page))
    .toEqual({
      page: "#f8fafc",
      surface: "#fff",
      text: "#253041",
      accent: "#2563eb",
    });

  await page.getByRole("button", { name: "テーマを切り替え" }).click();

  await expect
    .poll(() => readSemanticColors(page))
    .toEqual({
      page: "#111827",
      surface: "#182233",
      text: "#e6edf5",
      accent: "#8ab4ff",
    });
});

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

test("コードの Shiki 配色と文字装飾をライト・ダークテーマへ反映する", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/posts/2024-09-25-another-post");

  const codeBlock = page.locator(".code-block pre").first();
  const propertyToken = codeBlock
    .locator('span[style*="--shiki-light"]')
    .filter({ hasText: '"runtimeExecutable"' })
    .first();
  const commentToken = codeBlock
    .locator('span[style*="--shiki-light-font-style"]')
    .filter({ hasText: "<--" })
    .first();

  await expect(codeBlock).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(propertyToken).toHaveCSS("color", "rgb(0, 92, 197)");
  await expect(commentToken).toHaveCSS("font-style", "italic");

  await page.getByRole("button", { name: "テーマを切り替え" }).click();

  await expect(codeBlock).toHaveCSS("background-color", "rgb(36, 41, 46)");
  await expect(propertyToken).toHaveCSS("color", "rgb(121, 184, 255)");
  await expect(commentToken).toHaveCSS("color", "rgb(253, 174, 183)");
  await expect(commentToken).toHaveCSS("font-style", "italic");
});

test("コードのコピーボタンは hover 時も両テーマで読める", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/posts/2024-09-25-another-post");

  const copyButton = page
    .getByRole("button", { name: "コードをコピー" })
    .first();

  await copyButton.hover();
  await expect
    .poll(() => readContrastRatio(copyButton))
    .toBeGreaterThanOrEqual(4.5);

  await page.getByRole("button", { name: "テーマを切り替え" }).click();
  await copyButton.hover();
  await expect
    .poll(() => readContrastRatio(copyButton))
    .toBeGreaterThanOrEqual(4.5);
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
