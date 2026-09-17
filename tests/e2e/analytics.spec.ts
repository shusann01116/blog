import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    analyticsCalls: unknown[][];
  }
}

test("本番 origin の Router 遷移を現在の title で一度ずつ送る", async ({
  page,
}) => {
  test.skip(
    process.env.TEST_ANALYTICS_ENABLED !== "true",
    "VITE_ENABLE_ANALYTICS=true の専用 build で実行する",
  );

  const analyticsRequests: string[] = [];
  page.on("request", (request) => {
    if (/google-analytics\.com|googletagmanager\.com/.test(request.url())) {
      analyticsRequests.push(request.url());
    }
  });
  await page.addInitScript(() => {
    window.analyticsCalls = [];
    window.gtag = (command, target, parameters) => {
      window.analyticsCalls.push([command, target, parameters]);
    };
  });
  await page.route("https://www.googletagmanager.com/**", (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" }),
  );
  await page.route("https://blog.shusann01116.dev/**", async (route) => {
    const requested = new URL(route.request().url());
    const response = await route.fetch({
      url: `http://localhost:3101${requested.pathname}${requested.search}`,
    });
    await route.fulfill({ response });
  });

  await page.goto("https://blog.shusann01116.dev/");
  await expect(page).toHaveTitle("shusann01116");
  await expect
    .poll(() => page.evaluate(() => window.analyticsCalls.slice()))
    .toEqual([
      ["config", "G-2NJX07FBDF", { send_page_view: false }],
      [
        "event",
        "page_view",
        {
          page_location: "https://blog.shusann01116.dev/",
          page_title: "shusann01116",
        },
      ],
    ]);

  await page.getByRole("link", { name: "Posts", exact: true }).click();
  await expect(page).toHaveTitle("Posts");
  await page.goBack();
  await expect(page).toHaveTitle("shusann01116");

  await expect
    .poll(() => page.evaluate(() => window.analyticsCalls.slice()))
    .toEqual([
      ["config", "G-2NJX07FBDF", { send_page_view: false }],
      [
        "event",
        "page_view",
        {
          page_location: "https://blog.shusann01116.dev/",
          page_title: "shusann01116",
        },
      ],
      [
        "event",
        "page_view",
        {
          page_location: "https://blog.shusann01116.dev/posts",
          page_title: "Posts",
        },
      ],
      [
        "event",
        "page_view",
        {
          page_location: "https://blog.shusann01116.dev/",
          page_title: "shusann01116",
        },
      ],
    ]);
  expect(analyticsRequests).toEqual([
    "https://www.googletagmanager.com/gtag/js?id=G-2NJX07FBDF",
  ]);
});
