export interface SearchResult {
  url: string;
  title: string;
  excerpt: string;
}

interface PagefindData {
  url: string;
  meta: { title?: string };
  excerpt: string;
}

interface PagefindEntry {
  data: () => Promise<PagefindData>;
}

interface PagefindModule {
  search: (query: string) => Promise<{ results: PagefindEntry[] }>;
}

const modulePath = "/_pagefind/pagefind.js";
let moduleAttempt = 0;
let pendingModule: Promise<PagefindModule> | undefined;

function loadPagefind(): Promise<PagefindModule> {
  if (pendingModule) return pendingModule;

  const url = `${modulePath}?attempt=${moduleAttempt}`;
  pendingModule = import(/* @vite-ignore */ url).catch((error: unknown) => {
    pendingModule = undefined;
    moduleAttempt += 1;
    throw error;
  });
  return pendingModule;
}

function plainText(markup: string): string {
  const document = new DOMParser().parseFromString(markup, "text/html");
  return document.body.textContent?.trim() ?? "";
}

function cleanUrl(url: string): string {
  return url
    .replace(/\/index\.html(?=([?#]|$))/, "/")
    .replace(/\.html(?=([?#]|$))/, "");
}

export async function searchPosts(query: string): Promise<SearchResult[]> {
  const pagefind = await loadPagefind();
  const result = await pagefind.search(query);
  const items = await Promise.all(
    result.results.slice(0, 20).map((entry) => entry.data()),
  );

  return items.map((item) => ({
    url: cleanUrl(item.url),
    title: item.meta.title ?? item.url,
    excerpt: plainText(item.excerpt),
  }));
}
