import { useMemo } from "react";

type ClassName<State> =
  string | ((state: State) => string | undefined) | undefined;

export function useMergedClassName<State>(
  baseClassName: string,
  className: ClassName<State>,
): ClassName<State> {
  return useMemo(
    () =>
      typeof className === "function"
        ? (state: State) => `${baseClassName} ${className(state) ?? ""}`
        : `${baseClassName} ${className ?? ""}`,
    [baseClassName, className],
  );
}
