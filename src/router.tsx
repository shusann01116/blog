import { createRouter } from "@tanstack/react-router";

import { ErrorView, NotFoundView } from "./components/error-view";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    defaultErrorComponent: ErrorView,
    defaultNotFoundComponent: NotFoundView,
    scrollRestoration: true,
    trailingSlash: "preserve",
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
