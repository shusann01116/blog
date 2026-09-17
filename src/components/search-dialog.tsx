import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";

import { searchPosts } from "@/lib/pagefind";
import type { SearchResult } from "@/lib/pagefind";
import { Button } from "@/shared/components/button";
import { Dialog } from "@/shared/components/dialog";
import { Input } from "@/shared/components/input";

type SearchState =
  | { status: "empty" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; results: SearchResult[] };

interface SearchRequest {
  query: string;
  retry: number;
}

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchRequest, setSearchRequest] = useState<SearchRequest>();
  const [state, setState] = useState<SearchState>({ status: "empty" });
  const openRef = useRef(false);
  const requestRef = useRef(0);

  useEffect(() => {
    const request = ++requestRef.current;
    if (!open || !searchRequest) return;

    void searchPosts(searchRequest.query).then(
      (results) => {
        if (openRef.current && request === requestRef.current) {
          setState({ status: "ready", results });
        }
      },
      () => {
        if (openRef.current && request === requestRef.current) {
          setState({ status: "error" });
        }
      },
    );
  }, [open, searchRequest]);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    openRef.current = nextOpen;
    requestRef.current += 1;
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
      setSearchRequest(undefined);
      setState({ status: "empty" });
    }
  }, []);

  const handleQueryChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextQuery = event.target.value;
      const normalizedQuery = nextQuery.trim();
      requestRef.current += 1;
      setQuery(nextQuery);
      if (normalizedQuery.length === 0) {
        setSearchRequest(undefined);
        setState({ status: "empty" });
        return;
      }
      setState({ status: "loading" });
      setSearchRequest({ query: normalizedQuery, retry: 0 });
    },
    [],
  );

  const handleRetry = useCallback(() => {
    setState({ status: "loading" });
    setSearchRequest((current) =>
      current ? { ...current, retry: current.retry + 1 } : current,
    );
  }, []);

  return (
    <Dialog.Root onOpenChange={handleOpenChange} open={open}>
      <Dialog.Trigger>検索</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup className="search-dialog">
          <div className="search-dialog__header">
            <Dialog.Title>記事を検索</Dialog.Title>
            <Dialog.Close aria-label="検索を閉じる">閉じる</Dialog.Close>
          </div>
          <Input
            aria-label="記事を検索"
            autoComplete="off"
            onChange={handleQueryChange}
            placeholder="検索語を入力"
            type="search"
            value={query}
          />
          <div aria-live="polite" className="search-dialog__status">
            {state.status === "empty" && <p>検索語を入力してください</p>}
            {state.status === "loading" && <p>検索中…</p>}
            {state.status === "error" && (
              <div className="search-dialog__error">
                <p>検索を読み込めませんでした</p>
                <Button onClick={handleRetry}>再試行</Button>
              </div>
            )}
            {state.status === "ready" && state.results.length === 0 && (
              <p>記事が見つかりませんでした</p>
            )}
          </div>
          {state.status === "ready" && state.results.length > 0 && (
            <ul className="search-results">
              {state.results.map((result) => (
                <li key={result.url}>
                  <a href={result.url}>{result.title}</a>
                  {result.excerpt.length > 0 && <p>{result.excerpt}</p>}
                </li>
              ))}
            </ul>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
