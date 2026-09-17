import { Link } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";

import { Button } from "@/shared/components/button";

function reloadPage() {
  window.location.reload();
}

export function NotFoundView() {
  return (
    <main className="error-view" data-pagefind-ignore="all">
      <p className="error-view__status">404</p>
      <h1>ページが見つかりません</h1>
      <p>指定されたページは移動したか、削除された可能性があります。</p>
      <Link to="/">ホームへ戻る</Link>
    </main>
  );
}

export function ErrorView(_props: ErrorComponentProps) {
  return (
    <main className="error-view" data-pagefind-ignore="all">
      <p className="error-view__status">Error</p>
      <h1>ページを表示できませんでした</h1>
      <p>一時的な問題が発生しました。もう一度お試しください。</p>
      <Button onClick={reloadPage} type="button">
        再試行
      </Button>
    </main>
  );
}
