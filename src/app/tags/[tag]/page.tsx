import { PostCard } from "nextra-theme-blog";
import { getPosts, getTags } from "@/utils/get-posts.js";

export async function generateMetadata(props: PageProps<"/tags/[tag]">) {
  const params = await props.params;
  return {
    title: `Posts Tagged with “${decodeURIComponent(params.tag)}”`,
  };
}

export async function generateStaticParams() {
  const allTags = await getTags();
  return [...new Set(allTags)].map((tag) => ({ tag }));
}

export default async function TagPage(props: PageProps<"/tags/[tag]">) {
  const params = await props.params;
  const { title } = await generateMetadata(props);
  const posts = await getPosts();
  return (
    <>
      <h1>{title}</h1>
      {posts
        .filter((post) =>
          post.frontMatter.tags.includes(decodeURIComponent(params.tag)),
        )
        .map((post) => (
          <PostCard key={post.route} post={post} />
        ))}
    </>
  );
}
