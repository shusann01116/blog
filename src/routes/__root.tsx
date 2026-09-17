/* oxlint-disable next/no-head-element -- Start root routes render the complete HTML document. */
import {
  createRootRoute,
  HeadContent,
  Outlet,
  redirect,
  Scripts,
} from "@tanstack/react-router";

import styleUrl from "@/styles/start.css?url";
import notoSansJp400Url from "@fontsource/noto-sans-jp/400.css?url";
import notoSansJp700Url from "@fontsource/noto-sans-jp/700.css?url";

import { Analytics } from "@/components/analytics";
import { ErrorView, NotFoundView } from "@/components/error-view";
import { SiteLayout } from "@/components/site-layout";
import { site } from "@/lib/site";
import { themeInitScript } from "@/lib/theme";

const themeScriptContent = { __html: themeInitScript };

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    if (location.pathname !== "/" && location.pathname.endsWith("/")) {
      throw redirect({
        href: `${location.pathname.slice(0, -1)}${location.searchStr}${location.hash}`,
        statusCode: 308,
      });
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: site.title },
    ],
    links: [
      { rel: "stylesheet", href: notoSansJp400Url },
      { rel: "stylesheet", href: notoSansJp700Url },
      { rel: "stylesheet", href: styleUrl },
      { rel: "icon", href: "/favicon.ico" },
    ],
  }),
  errorComponent: ErrorView,
  notFoundComponent: NotFoundView,
  component: () => (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={themeScriptContent} />
        <HeadContent />
      </head>
      <body>
        <SiteLayout>
          <Outlet />
        </SiteLayout>
        <Analytics />
        <Scripts />
      </body>
    </html>
  ),
});
