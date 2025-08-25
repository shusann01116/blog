import { Footer, Layout, Navbar, ThemeSwitch } from "nextra-theme-blog";
import { Head, Search } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-blog/style.css";
import "@/styles/global.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import {
  SiZenn,
  SiQiita,
  SiGithub,
  SiRss,
} from "@icons-pack/react-simple-icons";

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
            <div className="flex flex-row items-center gap-4">
              <span className="flex gap-3 flex-row">
                <a
                  href="https://zenn.dev/shusann01116"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <SiZenn size={24} color="#3EA8FF" />
                </a>
                <a
                  href="https://qiita.com/shusann01116"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <SiQiita size={24} color="#55C500" />
                </a>
                <a
                  href="https://github.com/shusann01116"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <SiGithub size={24} />
                </a>
                <a href="/rss.xml" target="_blank" rel="noopener noreferrer">
                  <SiRss size={24} />
                </a>
              </span>
              <section className="text-sm text-gray-500 dark:text-gray-400 leading-4 ml-auto">
                MIT {new Date().getFullYear()} © shusann01116.
              </section>
            </div>
          </Footer>
        </Layout>
      </body>
    </html>
  );
}
