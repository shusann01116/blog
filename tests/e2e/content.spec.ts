import { expect, test } from "@playwright/test";

test("日本語見出しへの既存リンクを維持する", async ({ page }) => {
  await page.goto("/posts/2025-08-26");
  await page.getByRole("link", { name: "以前の記事" }).click();
  await expect(page).toHaveURL(
    (url) =>
      url.pathname === "/posts/2025-05-17-2025-goals" && url.hash.length > 1,
  );
  const id = decodeURIComponent(new URL(page.url()).hash.slice(1));

  expect(id).toBe(
    "チームが拡大し再編されキャリアの中で初めての仕事を任されている",
  );
  const heading = page.getByRole("heading", { name: id });
  await expect(heading).toBeVisible();
  await expect(heading).toHaveAttribute("id", id);
  await expect
    .poll(() =>
      heading.evaluate((element) => {
        const { bottom, top } = element.getBoundingClientRect();
        return top < window.innerHeight && bottom >= 0;
      }),
    )
    .toBe(true);
});

test("記事内の画像、iframe、コードを表示する", async ({ page }) => {
  await page.goto("/posts/2025-03-08");
  await expect(page.getByRole("img", { name: "lgtmoon-rs" })).toHaveAttribute(
    "src",
    "/imgs/lgtmoon-rs.png",
  );

  await page.goto("/posts/2025-05-17-2025-goals");
  await expect(
    page.locator('iframe[title="YouTube video player"]'),
  ).toHaveAttribute(
    "src",
    "https://www.youtube.com/embed/sRQccRV9s5w?si=KJ_g0nM6MD_mJ-s5",
  );

  await page.goto("/posts/2024-09-25-another-post");
  await expect(page.locator("pre code").first()).toContainText(
    '"runtimeExecutable": "sh"',
  );
});

test("JavaScript 無効でも初期 HTML に記事本文を表示する", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  try {
    const response = await page.goto("/posts/2025-08-26");
    expect(response?.status()).toBe(200);
    await expect(
      page.getByText("それはある日、他のチームリーダー"),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "本との出会い" }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});
