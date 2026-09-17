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
import pages from "./src/generated/pages.json" with { type: "json" };

const mdxPlugin = {
  ...mdx({
    include: "**/src/content/**/*.mdx",
    remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypePrettyCode,
        { theme: { light: "github-light", dark: "github-dark" } },
      ],
    ],
  }),
  enforce: "pre" as const,
};

export default defineConfig({
  server: { port: 3101 },
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
  plugins: [
    contentPlugin(),
    mdxPlugin,
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart({
      prerender: {
        enabled: true,
        failOnError: true,
        crawlLinks: false,
        autoStaticPathsDiscovery: false,
        autoSubfolderIndex: false,
      },
      pages,
    }),
    react({ include: /\.(mdx|[jt]sx?)$/ }),
  ],
});
