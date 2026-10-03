import nextra from "nextra";

const withNextra = nextra({
  defaultShowCopyCode: true,
  readingTime: true,
});

export default withNextra({
  output: "export",
  images: { unoptimized: true },
  cleanDistDir: true,
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      "next-mdx-import-source-file": "./src/mdx-components.mjs",
    },
  },
  typedRoutes: true,
});
