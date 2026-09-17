import { Link } from "@tanstack/react-router";
import type { ComponentProps, ComponentPropsWithoutRef } from "react";
import type { MDXComponents } from "mdx/types";

import { CodeBlock } from "@/components/code-block";
import { PostLink, TagLink } from "@/components/internal-link";

function MdxAnchor({ href, ...props }: ComponentPropsWithoutRef<"a">) {
  if (!href?.startsWith("/")) return <a href={href} {...props} />;

  const url = new URL(href, "https://blog.shusann01116.dev");
  const postMatch = /^\/posts\/([^/]+)$/.exec(url.pathname);
  if (postMatch?.[1]) {
    return (
      <PostLink
        slug={decodeURIComponent(postMatch[1])}
        hash={url.hash ? decodeURIComponent(url.hash.slice(1)) : undefined}
        {...props}
      />
    );
  }

  if (url.pathname === "/posts") {
    return <Link to="/posts" {...props} />;
  }

  const tagMatch = /^\/tags\/([^/]+)$/.exec(url.pathname);
  if (tagMatch?.[1]) {
    return <TagLink tag={decodeURIComponent(tagMatch[1])} {...props} />;
  }

  if (url.pathname === "/") {
    return <Link to="/" {...props} />;
  }

  return <a href={href} {...props} />;
}

function MdxHeadingOne({ id: _id, ...props }: ComponentProps<"h1">) {
  return <h1 {...props} />;
}

export const startMdxComponents: MDXComponents = {
  a: MdxAnchor,
  h1: MdxHeadingOne,
  pre: CodeBlock,
};
