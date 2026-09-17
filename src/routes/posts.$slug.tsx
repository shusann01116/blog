import { createFileRoute, notFound } from "@tanstack/react-router";

import { TagLink } from "@/components/internal-link";
import { PostBody, preloadPostBody } from "@/components/post-body";
import { getPost } from "@/lib/posts";

export const Route = createFileRoute("/posts/$slug")({
  loader: async ({ params }) => {
    const post = getPost(params.slug);
    if (!post) throw notFound();
    await preloadPostBody(post.slug);
    return post;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: loaderData.title },
          { name: "description", content: loaderData.description },
        ]
      : [],
  }),
  component: PostPage,
});

function PostPage() {
  const post = Route.useLoaderData();

  return (
    <main>
      <article>
        <header>
          <h1>{post.title}</h1>
          <p>
            {post.author},{" "}
            <time dateTime={`${post.date}T00:00:00.000Z`}>{post.date}</time>
          </p>
          <div>
            {post.tags.map((tag) => (
              <TagLink key={tag} tag={tag}>
                {tag}
              </TagLink>
            ))}
          </div>
        </header>
        <PostBody slug={post.slug} />
      </article>
    </main>
  );
}
