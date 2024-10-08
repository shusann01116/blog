/* see: https://github.com/shuding/nextra/blob/main/packages/nextra-theme-blog/src/types.ts */

/* eslint sort-keys: error */
export default {
  components: {
    h1: ({ children }) => (
      <h1
        style={{
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          backgroundImage:
            "linear-gradient(90deg,hsl(183, 100%, 50%),hsl(243, 100%, 50%))",
        }}
      >
        {children}
      </h1>
    ),
  },
  darkMode: true,
  dateFormatter: (date) => `Last updated at ${date.toDateString()}`,
  footer: (
    <small style={{ display: "block", marginTop: "8rem" }}>
      MIT
      {new Date().getFullYear()} © shusann01116.
      <style jsx>{`
        @media screen and (max-width: 480px) {
          article {
            padding-top: 2rem;
            padding-bottom: 4rem;
          }
        }
      `}</style>
    </small>
  ),
};
