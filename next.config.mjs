import nextra from "nextra";

const withNextra = nextra({
  defaultShowCopyCode: true,
  readingTime: true,
});

export default withNextra({
  reactStrictMode: true,
  cleanDistDir: true,
  typedRoutes: true,
  turbopack: {
    resolveAlias: {
      "next-mdx-import-source-file": "./src/mdx-components.mjs",
    },
  },
});
