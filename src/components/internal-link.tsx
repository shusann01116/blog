import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import type { ComponentPropsWithoutRef } from "react";

type AnchorProps = Omit<ComponentPropsWithoutRef<"a">, "href">;

export function PostLink({
  slug,
  ...props
}: AnchorProps & { slug: string; hash?: string }) {
  const params = useMemo(() => ({ slug }), [slug]);
  return <Link to="/posts/$slug" params={params} {...props} />;
}

export function TagLink({ tag, ...props }: AnchorProps & { tag: string }) {
  const params = useMemo(() => ({ tag }), [tag]);
  return <Link to="/tags/$tag" params={params} {...props} />;
}
