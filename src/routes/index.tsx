import { createFileRoute } from "@tanstack/react-router";

import Home from "@/content/home.mdx";
import { startMdxComponents } from "@/mdx/start-components";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "shusann01116" }] }),
  component: HomePage,
});

function HomePage() {
  return (
    <main data-pagefind-ignore="all">
      <Home components={startMdxComponents} />
    </main>
  );
}
