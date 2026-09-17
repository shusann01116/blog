import { createElement, lazy, Suspense } from "react";
import type { ComponentType, LazyExoticComponent } from "react";
import type { MDXProps } from "mdx/types";

import { postLoaders } from "@/generated/post-loaders";
import { startMdxComponents } from "@/mdx/start-components";

type MdxModule = { default: ComponentType<MDXProps> };
type MdxLoader = () => Promise<MdxModule>;

const loaders: Record<string, MdxLoader> = postLoaders;
const loadedBodies = new Map<string, ComponentType<MDXProps>>();
const pendingBodies = new Map<string, Promise<MdxModule>>();

function loadPostBody(slug: string): Promise<MdxModule> {
  const existing = pendingBodies.get(slug);
  if (existing) return existing;

  const loader = loaders[slug];
  if (!loader) return Promise.reject(new Error(`Unknown post: ${slug}`));

  const pending = loader().then((module) => {
    loadedBodies.set(slug, module.default);
    return module;
  });
  pendingBodies.set(slug, pending);
  return pending;
}

const postBodies = Object.fromEntries(
  Object.keys(loaders).map((slug) => [slug, lazy(() => loadPostBody(slug))]),
) as Record<string, LazyExoticComponent<ComponentType<MDXProps>>>;
const articleFallback = <p>Loading article…</p>;

export async function preloadPostBody(slug: string): Promise<void> {
  await loadPostBody(slug);
}

export function PostBody({ slug }: { slug: string }) {
  const Body = loadedBodies.get(slug) ?? postBodies[slug];
  if (!Body) return null;
  const content = createElement(Body, { components: startMdxComponents });

  return (
    <div data-pagefind-body>
      <Suspense fallback={articleFallback}>{content}</Suspense>
    </div>
  );
}
