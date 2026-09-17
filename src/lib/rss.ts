import type { PostMeta } from "./post-types";
import { site } from "./site";

const escapeXml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[character]!,
  );

export function renderRss(posts: readonly PostMeta[]): string {
  const items = posts
    .map((post) => {
      const url = `${site.origin}/posts/${post.slug}`;
      const publishedAt = new Date(`${post.date}T00:00:00.000Z`).toUTCString();

      return `<item>
        <title>${escapeXml(post.title)}</title>
        <description>${escapeXml(post.description)}</description>
        <link>${escapeXml(url)}</link>
        <pubDate>${publishedAt}</pubDate>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(site.title)}</title>
    <link>${escapeXml(site.origin)}</link>
    <description>${escapeXml(site.description)}</description>
    <language>${escapeXml(site.language)}</language>
${items}
  </channel>
</rss>`;
}
