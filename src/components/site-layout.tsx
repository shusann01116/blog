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
    <div className="isolate flex min-h-screen flex-col">
      <header
        className="border-border border-b bg-[color-mix(in_srgb,var(--surface)_92%,transparent)]"
        data-pagefind-ignore="all"
      >
        <div className="mx-auto flex min-h-16 w-[min(calc(100%-2rem),56rem)] items-center gap-5 max-[34rem]:min-h-0 max-[34rem]:flex-wrap max-[34rem]:gap-x-4 max-[34rem]:gap-y-2 max-[34rem]:py-3">
          <Link
            className="text-text font-bold whitespace-nowrap no-underline max-[34rem]:w-full"
            to="/"
          >
            shusann01116
          </Link>
          <nav aria-label="メイン" className="flex items-center gap-4">
            <Link
              activeProps={activePageProps}
              className="text-[0.925rem] text-text-muted no-underline hover:text-text aria-[current=page]:text-text"
              to="/"
            >
              Home
            </Link>
            <Link
              activeProps={activePageProps}
              className="text-[0.925rem] text-text-muted no-underline hover:text-text aria-[current=page]:text-text"
              to="/posts"
            >
              Posts
            </Link>
          </nav>
          <div className="ml-auto flex min-w-11 items-center justify-end gap-2 max-[34rem]:min-w-0">
            <div className="empty:hidden" data-search-slot>
              <SearchDialog />
            </div>
            <ThemeSwitch />
          </div>
        </div>
      </header>

      <div className="site-content mx-auto w-[min(calc(100%-2rem),48rem)] flex-1 py-[clamp(2rem,6vw,4rem)] [&>main]:min-w-0">
        {children}
      </div>

      <footer
        className="mt-8 border-border border-t text-text-muted"
        data-pagefind-ignore="all"
      >
        <div className="mx-auto flex min-h-16 w-[min(calc(100%-2rem),56rem)] items-center justify-between gap-5 max-[34rem]:min-h-20 max-[34rem]:flex-col max-[34rem]:justify-center max-[34rem]:gap-[0.4rem] max-[34rem]:py-3">
          <nav
            aria-label="ソーシャルリンク"
            className="flex items-center gap-[0.9rem]"
          >
            {socialLinks.map(({ href, icon, label }) => (
              <a
                aria-label={label}
                className="inline-flex text-text"
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
