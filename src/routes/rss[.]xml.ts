import { createFileRoute } from "@tanstack/react-router";

import { getPosts } from "@/lib/posts";
import { renderRss } from "@/lib/rss";

export const Route = createFileRoute("/rss.xml")({
  server: {
    handlers: {
      GET: () =>
        new Response(renderRss(getPosts()), {
          headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
        }),
    },
  },
});
