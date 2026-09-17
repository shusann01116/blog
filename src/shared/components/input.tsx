import { Input as BaseInput } from "@base-ui/react/input";
import type { ComponentProps } from "react";

import { useMergedClassName } from "@/shared/components/class-name";

const baseClassName = "ui-input";

export function Input({
  className,
  ...props
}: ComponentProps<typeof BaseInput>) {
  const mergedClassName = useMergedClassName(baseClassName, className);

  return <BaseInput {...props} className={mergedClassName} />;
}
