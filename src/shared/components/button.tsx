import { Button as BaseButton } from "@base-ui/react/button";
import type { ComponentProps } from "react";

import { useMergedClassName } from "@/shared/components/class-name";

export const buttonClassName =
  "inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-[0.6rem] border border-border bg-surface px-3 py-[0.45rem] text-text hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50";

export function Button({
  className,
  ...props
}: ComponentProps<typeof BaseButton>) {
  const mergedClassName = useMergedClassName(buttonClassName, className);

  return <BaseButton {...props} className={mergedClassName} />;
}
