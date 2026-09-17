import { afterEach, describe, expect, test, vi } from "vitest";

import { shouldTrack, trackPageView } from "../../src/lib/analytics";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("shouldTrack", () => {
  test("本番 origin で有効な場合だけ計測する", () => {
    expect(shouldTrack("https://blog.shusann01116.dev", true)).toBe(true);
    expect(shouldTrack("http://localhost:3101", true)).toBe(false);
    expect(shouldTrack("https://blog.shusann01116.dev", false)).toBe(false);
  });
});

test("一度だけ初期化し、連続重複を除いて移動と戻るを送る", () => {
  const gtag =
    vi.fn<
      (
        command: string,
        target: string,
        parameters: Record<string, unknown>,
      ) => void
    >();
  const appendChild = vi.fn<(node: unknown) => void>();
  const script = { async: false, src: "" };
  vi.stubGlobal("window", { dataLayer: [], gtag });
  vi.stubGlobal("document", {
    createElement: vi.fn<() => typeof script>(() => script),
    head: { appendChild },
  });

  trackPageView("https://blog.shusann01116.dev/", "Home");
  trackPageView("https://blog.shusann01116.dev/", "Home");
  trackPageView("https://blog.shusann01116.dev/posts", "Posts");
  trackPageView("https://blog.shusann01116.dev/", "Home");

  expect(gtag.mock.calls).toEqual([
    ["config", "G-2NJX07FBDF", { send_page_view: false }],
    [
      "event",
      "page_view",
      {
        page_location: "https://blog.shusann01116.dev/",
        page_title: "Home",
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
        page_title: "Home",
      },
    ],
  ]);
  expect(appendChild).toHaveBeenCalledOnce();
  expect(script).toEqual({
    async: true,
    src: "https://www.googletagmanager.com/gtag/js?id=G-2NJX07FBDF",
  });
});
