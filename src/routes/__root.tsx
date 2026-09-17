/* oxlint-disable next/no-head-element -- Start root routes render the complete HTML document. */
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";

import styleUrl from "@/styles/start.css?url";

export const Route = createRootRoute({
  head: () => ({ links: [{ rel: "stylesheet", href: styleUrl }] }),
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
