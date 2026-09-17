import { Input as BaseInput } from "@base-ui/react/input";
import type { ComponentProps } from "react";

import { useMergedClassName } from "@/shared/components/class-name";

const inputClassName =
  "min-h-11 w-full rounded-[0.6rem] border border-border bg-surface px-3 py-2 text-text";

export function Input({
  className,
  ...props
}: ComponentProps<typeof BaseInput>) {
  const mergedClassName = useMergedClassName(inputClassName, className);

  return <BaseInput {...props} className={mergedClassName} />;
}
