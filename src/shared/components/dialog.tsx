import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ComponentProps } from "react";

import { useMergedClassName } from "@/shared/components/class-name";

export const Root = BaseDialog.Root;
export const Portal = BaseDialog.Portal;

export function Trigger({
  className,
  ...props
}: ComponentProps<typeof BaseDialog.Trigger>) {
  const classNames = useMergedClassName("dialog-trigger", className);

  return <BaseDialog.Trigger {...props} className={classNames} />;
}

export function Backdrop({
  className,
  ...props
}: ComponentProps<typeof BaseDialog.Backdrop>) {
  const classNames = useMergedClassName("dialog-backdrop", className);

  return <BaseDialog.Backdrop {...props} className={classNames} />;
}

export function Popup({
  className,
  ...props
}: ComponentProps<typeof BaseDialog.Popup>) {
  const classNames = useMergedClassName("dialog-popup", className);

  return <BaseDialog.Popup {...props} className={classNames} />;
}

export function Title({
  className,
  ...props
}: ComponentProps<typeof BaseDialog.Title>) {
  const classNames = useMergedClassName("dialog-title", className);

  return <BaseDialog.Title {...props} className={classNames} />;
}

export function Close({
  className,
  ...props
}: ComponentProps<typeof BaseDialog.Close>) {
  const classNames = useMergedClassName("dialog-close", className);

  return <BaseDialog.Close {...props} className={classNames} />;
}

export const Dialog = { Root, Trigger, Portal, Backdrop, Popup, Title, Close };
