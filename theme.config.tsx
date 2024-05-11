import React from "react";
import { useRouter } from "next/router";
import { useConfig } from "nextra-theme-docs";
import { DocsThemeConfig } from "nextra-theme-docs";

const config: DocsThemeConfig = {
  logo: (
    <>
      <span style={{ marginLeft: "0.5rem", fontWeight: 800 }}>
        shusann&apos;s showcase
      </span>
    </>
  ),
  project: {
    link: "https://github.com/shusann01116/showcase",
  },
  docsRepositoryBase: "https://github.com/shusann01116/showcase/tree/main",
  useNextSeoProps() {
    const { asPath } = useRouter();
    if (asPath !== "/") {
      return {
        titleTemplate: "%s | shusann's showcase",
        openGraph: {
          title: "shusann's showcase",
        },
      };
    }
  },
  head: () => {
    const { asPath, defaultLocale, locale } = useRouter();
    const { frontMatter } = useConfig();
    const url = `https://blog.shusann.dev${asPath === "/" ? "" : asPath}`;

    return (
      <>
        <meta property="og:url" content={url} />
        <meta property="og:site_name" content="shusann's showcase" />
        <meta property="og:title" content={frontMatter.title} />
        <meta property="og:description" content={frontMatter.description} />
        <meta
          property="og:image"
          content={`https://blog.shusann.dev/og/${
            locale || defaultLocale
          }.png`}
        />
      </>
    );
  },
  footer: {
    text: (
      <>
        <span>&copy; {new Date().getFullYear()} shusann</span>
        <a
          href="https://blog.shusann.dev"
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginLeft: "1rem" }}
        >
          blog.shusann.dev
        </a>
      </>
    ),
  },
  faviconGlyph: "📦",
};

export default config;
