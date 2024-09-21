// eslint-disable-next-line import/no-anonymous-default-export
export default {
  footer: <p>MIT 2024 © shusann01116.</p>,
  head: ({ title, meta }) => (
    <>
      {meta.description && (
        <meta name="description" content={meta.description} />
      )}
      {meta.tag && <meta name="keywords" content={meta.tag} />}
      {meta.author && <meta name="author" content={meta.author} />}
    </>
  ),
  readMore: "Read More →",
  postFooter: null,
  darkMode: false,
  navs: [
    {
      url: "https://github.com/shusann01116/blog",
      name: "GitHub",
    },
  ],
};
