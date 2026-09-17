import { createFileRoute } from "@tanstack/react-router";

import { PostCard } from "@/components/post-card";
import { TagLink } from "@/components/internal-link";
import { countTags, getPosts } from "@/lib/posts";

export const Route = createFileRoute("/posts/")({
  loader: () => getPosts(),
  head: () => ({ meta: [{ title: "Posts" }] }),
  component: PostsPage,
});

function PostsPage() {
  const posts = Route.useLoaderData();
  const tags = countTags(posts);

  return (
    <main data-pagefind-ignore="all">
      <h1>Posts</h1>
      <nav aria-label="Tags" className="flex flex-wrap gap-2">
        {Object.entries(tags).map(([tag, count]) => (
          <TagLink key={tag} tag={tag}>
            {tag} ({count})
          </TagLink>
        ))}
      </nav>
      {posts.map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </main>
  );
}
