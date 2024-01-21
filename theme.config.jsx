import React from 'react';
import { useRouter } from 'next/router';
import { useConfig } from 'nextra-theme-docs';

export default {
  logo: (
    <>
      <span style={{ merginLeft: "0.5rem", fontWeight: 800 }}>shusann&apos;s showcase</span>
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
      }
    }
  },
  head: () => {
    const { asPath, defaultLocale, locale } = useRouter();
    const { frontMatter } = useConfig();
    const url = `https://showcase.shusann.dev${asPath === "/" ? "" : asPath}`;

    return (
      <>
        <meta property="og:url" content={url} />
        <meta property="og:site_name" content="shusann's showcase" />
        <meta property="og:title" content={frontMatter.title} />
        <meta property="og:description" content={frontMatter.description} />
        <meta property="og:image" content={`https://showcase.shusann.dev/og/${locale || defaultLocale}.png`} />
      </>
    )
  },
  footer: {
    text: (
      <>
        <span>&copy; {new Date().getFullYear()} shusann</span>
        <a href="https://showcase.shusann.dev" target="_blank" rel="noopener noreferrer" style={{ marginLeft: "1rem" }}>
          showcase.shusann.dev
        </a>
      </>
    )
  },
  faviconGlyph: "📦",
};
