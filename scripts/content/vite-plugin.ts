import path from "node:path";

import type { Plugin } from "vite";

import { buildContent } from "./build.ts";

type ContentMessage =
  | { type: "full-reload" }
  | {
      type: "error";
      err: { message: string; stack: string; plugin: "blog-content" };
    };

interface WatchContentOptions {
  contentRoot: string;
  generatedRoot: string;
  onAll: (listener: (event: string, changedPath: string) => void) => void;
  send: (message: ContentMessage) => void;
}

export function watchContent({
  contentRoot,
  generatedRoot,
  onAll,
  send,
}: WatchContentOptions): void {
  let pending = Promise.resolve();

  const regenerate = () => {
    pending = pending
      .catch(() => undefined)
      .then(async () => {
        await buildContent({ contentRoot, generatedRoot });
        send({ type: "full-reload" });
      });
    return pending;
  };

  onAll((event, changedPath) => {
    if (
      (event === "add" || event === "change" || event === "unlink") &&
      changedPath.endsWith(".mdx") &&
      path.resolve(changedPath).startsWith(`${contentRoot}${path.sep}`)
    ) {
      void regenerate().catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        send({
          type: "error",
          err: {
            message,
            stack: error instanceof Error ? (error.stack ?? message) : message,
            plugin: "blog-content",
          },
        });
      });
    }
  });
}

interface ContentPluginOptions {
  contentRoot?: string;
  generatedRoot?: string;
}

export function contentPlugin({
  contentRoot = path.resolve("src/content"),
  generatedRoot = path.resolve("src/generated"),
}: ContentPluginOptions = {}): Plugin {
  return {
    name: "blog-content",
    async buildStart() {
      await buildContent({ contentRoot, generatedRoot });
    },
    configureServer(devServer) {
      devServer.watcher.add(contentRoot);
      watchContent({
        contentRoot,
        generatedRoot,
        onAll: (listener) => {
          devServer.watcher.on("all", listener);
        },
        send: (message) => {
          devServer.ws.send(message);
        },
      });
    },
  };
}
