// eslint-disable-next-line @typescript-eslint/no-require-imports
const withNextra = require("nextra")({
  theme: "nextra-theme-blog",
  themeConfig: "./theme.config.jsx",
});
module.exports = withNextra();
