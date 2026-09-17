import { posts } from "../generated/posts";
import type { PostMeta } from "./post-types";

export function sortPosts(postsToSort: readonly PostMeta[]): PostMeta[] {
  return postsToSort.toSorted(
    (left, right) =>
      right.date.localeCompare(left.date) ||
      left.slug.localeCompare(right.slug),
  );
}

export function countTags(
  postsToCount: readonly PostMeta[],
): Record<string, number> {
  const counts = new Map<string, number>();
  for (const post of postsToCount) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Object.fromEntries(counts);
}

export function getPosts(): PostMeta[] {
  return [...posts];
}

export function getPost(slug: string): PostMeta | undefined {
  return posts.find((post) => post.slug === slug);
}

export function getPostsByTag(tag: string): PostMeta[] {
  return posts.filter((post) => post.tags.includes(tag));
}
