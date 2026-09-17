import type { PostMeta } from "@/lib/post-types";
import { PostLink, TagLink } from "@/components/internal-link";

export function PostCard({ post }: { post: PostMeta }) {
  return (
    <article>
      <h2>
        <PostLink slug={post.slug}>{post.title}</PostLink>
      </h2>
      <p>{post.description}</p>
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
    </article>
  );
}
