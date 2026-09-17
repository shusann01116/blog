import { useCallback, useRef, useState } from "react";
import type { ComponentProps } from "react";

import { Button } from "@/shared/components/button";

export function CodeBlock({ className = "", ...props }: ComponentProps<"pre">) {
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
    <div className="code-block">
      <Button
        aria-label="コードをコピー"
        className="code-block__copy"
        onClick={copyCode}
        type="button"
      >
        Copy
      </Button>
      <pre {...props} className={className} ref={preRef} />
      <span aria-live="polite" className="visually-hidden" role="status">
        {status}
      </span>
    </div>
  );
}
