import path from "node:path";

import type { Plugin, ViteDevServer } from "vite";

import { buildContent } from "./build.ts";

export function contentPlugin(): Plugin {
  const contentRoot = path.resolve("src/content");
  let server: ViteDevServer | undefined;
  let pending = Promise.resolve();

  const regenerate = () => {
    pending = pending
      .catch(() => undefined)
      .then(async () => {
        await buildContent({ contentRoot });
        server?.ws.send({ type: "full-reload" });
      });
    return pending;
  };

  return {
    name: "blog-content",
    async buildStart() {
      await buildContent({ contentRoot });
    },
    configureServer(devServer) {
      server = devServer;
      devServer.watcher.add(contentRoot);
      devServer.watcher.on("all", (event, changedPath) => {
        if (
          (event === "add" || event === "change" || event === "unlink") &&
          changedPath.endsWith(".mdx") &&
          path.resolve(changedPath).startsWith(`${contentRoot}${path.sep}`)
        ) {
          void regenerate().catch((error: unknown) => {
            const message =
              error instanceof Error ? error.message : String(error);
            devServer.ws.send({
              type: "error",
              err: {
                message,
                stack:
                  error instanceof Error ? (error.stack ?? message) : message,
                plugin: "blog-content",
              },
            });
            throw error;
          });
        }
      });
    },
  };
}
