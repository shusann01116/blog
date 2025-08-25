import { normalizePages } from "nextra/normalize-pages";
import { getPageMap } from "nextra/page-map";

export async function getPosts() {
  const { directories } = normalizePages({
    list: await getPageMap("/posts"),
    route: "/posts",
  });
  return directories
    .filter((post) => post.name !== "index")
    .sort((a, b) => {
      const dateA = new Date(a.frontMatter?.date ?? "").getTime();
      const dateB = new Date(b.frontMatter?.date ?? "").getTime();
      return dateB - dateA;
    });
}

export async function getTags() {
  const posts = await getPosts();
  const tags: string[] = posts.flatMap((post) => post.frontMatter?.tags ?? []);
  return tags;
}
