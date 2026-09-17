/* oxlint-disable next/no-head-element -- Start root routes render the complete HTML document. */
import {
  createRootRoute,
  HeadContent,
  Outlet,
  redirect,
  Scripts,
} from "@tanstack/react-router";

import styleUrl from "@/styles/start.css?url";

import { site } from "@/lib/site";

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
      { rel: "stylesheet", href: styleUrl },
      { rel: "icon", href: "/favicon.ico" },
    ],
  }),
  component: () => (
    <html lang="ja">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  ),
});
