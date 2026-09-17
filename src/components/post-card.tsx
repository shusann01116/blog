import type { PostMeta } from "@/lib/post-types";
import { PostLink, TagLink } from "@/components/internal-link";

export function PostCard({ post }: { post: PostMeta }) {
  return (
    <article className="my-5 rounded-2xl border border-border bg-surface p-[clamp(1.1rem,4vw,1.5rem)]">
      <h2 className="m-0 text-[clamp(1.25rem,5vw,1.55rem)]">
        <PostLink className="text-text no-underline" slug={post.slug}>
          {post.title}
        </PostLink>
      </h2>
      <p className="my-3">{post.description}</p>
      <p className="text-[0.85rem] text-text-muted">
        {post.author},{" "}
        <time dateTime={`${post.date}T00:00:00.000Z`}>{post.date}</time>
        <span aria-label={`読了時間 ${post.readingMinutes}分`}>
          {" "}
          · {post.readingMinutes} min read
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <TagLink key={tag} tag={tag}>
            {tag}
          </TagLink>
        ))}
      </div>
    </article>
  );
}
