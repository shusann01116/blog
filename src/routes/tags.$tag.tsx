import { createFileRoute } from "@tanstack/react-router";

import { PostCard } from "@/components/post-card";
import { getPostsByTag } from "@/lib/posts";

export const Route = createFileRoute("/tags/$tag")({
  loader: ({ params }) => ({
    posts: getPostsByTag(params.tag),
    tag: params.tag,
  }),
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [{ title: `Posts Tagged with “${loaderData.tag}”` }]
      : [],
  }),
  component: TagPage,
});

function TagPage() {
  const { posts, tag } = Route.useLoaderData();

  return (
    <main data-pagefind-ignore="all">
      <h1>Posts Tagged with “{tag}”</h1>
      {posts.map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </main>
  );
}
