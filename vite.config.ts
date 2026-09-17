import mdx from "@mdx-js/rollup";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { rehypePrettyCode } from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vite";

import { contentPlugin } from "./scripts/content/vite-plugin.ts";

export default defineConfig({
  server: { port: 3101 },
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
  plugins: [
    contentPlugin(),
    mdx({
      remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
      rehypePlugins: [rehypeSlug, rehypePrettyCode],
    }),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart({
      prerender: { enabled: true, failOnError: true, crawlLinks: false },
      pages: [{ path: "/" }],
    }),
    react({ include: /\.(?:js|jsx|md|mdx|ts|tsx)$/ }),
  ],
});
