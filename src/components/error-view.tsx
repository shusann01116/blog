import { Link } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";

import { Button } from "@/shared/components/button";

function reloadPage() {
  window.location.reload();
}

export function NotFoundView() {
  return (
    <main
      className="max-w-[38rem] py-[clamp(3rem,10vw,7rem)]"
      data-pagefind-ignore="all"
    >
      <p className="m-0 text-[0.85rem] font-bold tracking-[0.12em] text-text-muted uppercase">
        404
      </p>
      <h1 className="mt-[0.35rem] mb-3">ページが見つかりません</h1>
      <p className="mt-0 mb-6 text-text-muted">
        指定されたページは移動したか、削除された可能性があります。
      </p>
      <Link to="/">ホームへ戻る</Link>
    </main>
  );
}

export function ErrorView(_props: ErrorComponentProps) {
  return (
    <main
      className="max-w-[38rem] py-[clamp(3rem,10vw,7rem)]"
      data-pagefind-ignore="all"
    >
      <p className="m-0 text-[0.85rem] font-bold tracking-[0.12em] text-text-muted uppercase">
        Error
      </p>
      <h1 className="mt-[0.35rem] mb-3">ページを表示できませんでした</h1>
      <p className="mt-0 mb-6 text-text-muted">
        一時的な問題が発生しました。もう一度お試しください。
      </p>
      <Button onClick={reloadPage} type="button">
        再試行
      </Button>
    </main>
  );
}
