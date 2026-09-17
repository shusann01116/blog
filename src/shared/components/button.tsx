import { Button as BaseButton } from "@base-ui/react/button";
import type { ComponentProps } from "react";

import { useMergedClassName } from "@/shared/components/class-name";

const baseClassName = "ui-button";

export function Button({
  className,
  ...props
}: ComponentProps<typeof BaseButton>) {
  const mergedClassName = useMergedClassName(baseClassName, className);

  return <BaseButton {...props} className={mergedClassName} />;
}
