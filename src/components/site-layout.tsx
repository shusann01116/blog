import {
  SiGithub,
  SiQiita,
  SiRss,
  SiX,
  SiZenn,
} from "@icons-pack/react-simple-icons";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { SearchDialog } from "@/components/search-dialog";
import { ThemeSwitch } from "@/components/theme-switch";

const activePageProps = { "aria-current": "page" } as const;

const socialLinks = [
  {
    href: "https://zenn.dev/shusann01116",
    label: "Zenn",
    icon: <SiZenn aria-hidden="true" color="#3ea8ff" size={22} />,
  },
  {
    href: "https://qiita.com/shusann01116",
    label: "Qiita",
    icon: <SiQiita aria-hidden="true" color="#55c500" size={22} />,
  },
  {
    href: "https://github.com/shusann01116",
    label: "GitHub",
    icon: <SiGithub aria-hidden="true" size={22} />,
  },
  {
    href: "https://x.com/beans_splash",
    label: "X",
    icon: <SiX aria-hidden="true" size={22} />,
  },
  {
    href: "/rss.xml",
    label: "RSS",
    icon: <SiRss aria-hidden="true" color="#ee802f" size={22} />,
  },
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell">
      <header className="site-header" data-pagefind-ignore="all">
        <div className="site-header__inner">
          <Link className="site-brand" to="/">
            shusann01116
          </Link>
          <nav aria-label="メイン" className="site-nav">
            <Link activeProps={activePageProps} to="/">
              Home
            </Link>
            <Link activeProps={activePageProps} to="/posts">
              Posts
            </Link>
          </nav>
          <div className="site-actions">
            <div className="site-search-slot" data-search-slot>
              <SearchDialog />
            </div>
            <ThemeSwitch />
          </div>
        </div>
      </header>

      <div className="site-content">{children}</div>

      <footer className="site-footer" data-pagefind-ignore="all">
        <div className="site-footer__inner">
          <nav aria-label="ソーシャルリンク" className="social-links">
            {socialLinks.map(({ href, icon, label }) => (
              <a
                aria-label={label}
                href={href}
                key={label}
                rel={
                  href.startsWith("http") ? "noopener noreferrer" : undefined
                }
                target={href.startsWith("http") ? "_blank" : undefined}
              >
                {icon}
              </a>
            ))}
          </nav>
          <small>{new Date().getFullYear()} © shusann01116.</small>
        </div>
      </footer>
    </div>
  );
}
