import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

import { shouldTrack, trackPageView } from "@/lib/analytics";
import { site } from "@/lib/site";

const analyticsEnabled =
  import.meta.env.PROD && import.meta.env.VITE_ENABLE_ANALYTICS === "true";

export function Analytics() {
  const page = useRouterState({
    select: (state) => {
      if (state.status !== "idle") return null;

      let title: string = site.title;
      for (const match of state.matches) {
        for (const meta of match.meta ?? []) {
          if (meta?.title) title = meta.title;
        }
      }

      return {
        href: (state.resolvedLocation ?? state.location).href,
        title,
      };
    },
  });

  useEffect(() => {
    if (!page) return;
    if (!shouldTrack(window.location.origin, analyticsEnabled)) return;

    trackPageView(new URL(page.href, window.location.origin).href, page.title);
  }, [page]);

  return null;
}
