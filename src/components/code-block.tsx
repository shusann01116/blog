import { useCallback, useRef, useState } from "react";
import type { ComponentPropsWithoutRef } from "react";

import { Button } from "@/shared/components/button";

export function CodeBlock({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"pre">) {
  const preRef = useRef<HTMLPreElement>(null);
  const [status, setStatus] = useState("");

  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(preRef.current?.textContent ?? "");
      setStatus("コードをコピーしました");
    } catch {
      setStatus("コードをコピーできませんでした");
    }
  }, []);

  return (
    <div className="code-block relative my-6">
      <Button
        aria-label="コードをコピー"
        className="absolute top-[0.6rem] right-[0.6rem] z-1 min-h-8! min-w-0! border-code-action-border! bg-code-action! px-[0.55rem] py-[0.2rem] text-xs text-code-action-text! hover:bg-code-action-hover!"
        onClick={copyCode}
        type="button"
      >
        Copy
      </Button>
      <pre
        {...props}
        className={`m-0 max-w-full overflow-x-auto rounded-[0.8rem] border border-border bg-code-bg p-[1.2rem] text-[0.85rem] leading-[1.65] text-code-text ${className}`}
        ref={preRef}
      />
      <span aria-live="polite" className="sr-only" role="status">
        {status}
      </span>
    </div>
  );
}
