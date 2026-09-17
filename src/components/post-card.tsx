import type { PostMeta } from "@/lib/post-types";
import { PostLink, TagLink } from "@/components/internal-link";

export function PostCard({ post }: { post: PostMeta }) {
  return (
    <article className="post-card">
      <h2 className="post-card__title">
        <PostLink slug={post.slug}>{post.title}</PostLink>
      </h2>
      <p className="post-card__description">{post.description}</p>
      <p className="post-meta">
        {post.author},{" "}
        <time dateTime={`${post.date}T00:00:00.000Z`}>{post.date}</time>
        <span aria-label={`読了時間 ${post.readingMinutes}分`}>
          {" "}
          · {post.readingMinutes} min read
        </span>
      </p>
      <div className="tag-list">
        {post.tags.map((tag) => (
          <TagLink key={tag} tag={tag}>
            {tag}
          </TagLink>
        ))}
      </div>
    </article>
  );
}
