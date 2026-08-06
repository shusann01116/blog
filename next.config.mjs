import nextra from "nextra";

const withNextra = nextra({
  defaultShowCopyCode: true,
  readingTime: true,
});

export default withNextra({
  cleanDistDir: true,
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      "next-mdx-import-source-file": "./src/mdx-components.mjs",
    },
  },
  typedRoutes: true,
});
