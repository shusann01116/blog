import Link from "next/link";
import { PostCard } from "nextra-theme-blog";
import { getPosts, getTags } from "@/utils/get-posts";
import type { CSSProperties } from "react";

export const metadata = {
  title: "Posts",
};

const tagListStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: ".5rem",
};

export default async function PostsPage() {
  const tags = await getTags();
  const posts = await getPosts();

  const allTags: Record<string, number> = tags.reduce<Record<string, number>>(
    (acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    },
    {},
  );

  return (
    <div data-pagefind-ignore="all">
      <h1>{metadata.title}</h1>
      <div className="not-prose" style={tagListStyle}>
        {Object.entries(allTags).map(([tag, count]) => (
          <Link key={tag} href={`/tags/${tag}`} className="nextra-tag">
            {tag} ({count})
          </Link>
        ))}
      </div>
      {posts.map((post) => (
        <PostCard key={post.route} post={post} />
      ))}
    </div>
  );
}
