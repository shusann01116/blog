import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ComponentProps } from "react";

import { buttonClassName } from "@/shared/components/button";
import { useMergedClassName } from "@/shared/components/class-name";

export const Root = BaseDialog.Root;
export const Portal = BaseDialog.Portal;

export function Trigger({
  className,
  ...props
}: ComponentProps<typeof BaseDialog.Trigger>) {
  const classNames = useMergedClassName(buttonClassName, className);

  return <BaseDialog.Trigger {...props} className={classNames} />;
}

export function Backdrop({
  className,
  ...props
}: ComponentProps<typeof BaseDialog.Backdrop>) {
  const classNames = useMergedClassName(
    "fixed inset-0 z-40 bg-overlay",
    className,
  );

  return <BaseDialog.Backdrop {...props} className={classNames} />;
}

export function Popup({
  className,
  ...props
}: ComponentProps<typeof BaseDialog.Popup>) {
  const classNames = useMergedClassName(
    "fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[min(calc(100%-2rem),34rem)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-2xl border border-border bg-surface p-5 shadow-[0_1.5rem_4rem_var(--dialog-shadow)]",
    className,
  );

  return <BaseDialog.Popup {...props} className={classNames} />;
}

export function Title({
  className,
  ...props
}: ComponentProps<typeof BaseDialog.Title>) {
  const classNames = useMergedClassName(
    "mt-0 mb-4 text-xl text-text",
    className,
  );

  return <BaseDialog.Title {...props} className={classNames} />;
}

export function Close({
  className,
  ...props
}: ComponentProps<typeof BaseDialog.Close>) {
  const classNames = useMergedClassName(buttonClassName, className);

  return <BaseDialog.Close {...props} className={classNames} />;
}

export const Dialog = { Root, Trigger, Portal, Backdrop, Popup, Title, Close };
