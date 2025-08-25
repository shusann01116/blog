import { Footer, Layout, Navbar, ThemeSwitch } from "nextra-theme-blog";
import { Head, Search } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-blog/style.css";
import "@/styles/global.css";
import { GoogleAnalytics } from "@next/third-parties/google";

export const metadata = {
  title: "shusann01116's blog",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Head backgroundColor={{ dark: "#0f172a", light: "#fefce8" }}>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <GoogleAnalytics gaId="G-2NJX07FBDF" />
      </Head>

      <body>
        <Layout>
          <Navbar pageMap={await getPageMap()}>
            <Search />
            <ThemeSwitch />
          </Navbar>
          {children}
          <Footer>
            <abbr
              title="This blog is licensed under the MIT License."
              className="cursor-help"
            >
              MIT
            </abbr>{" "}
            {new Date().getFullYear()} © shusann01116. RSS feed is available{" "}
            <a href="/rss.xml" className="underline">
              here
            </a>
            .
          </Footer>
        </Layout>
      </body>
    </html>
  );
}
