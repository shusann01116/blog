import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile, readdir } from "node:fs/promises";
import { createServer } from "node:http";
import { join } from "node:path";

// Smoke-test the built export over HTTP without a browser or new dependencies.
// Internal Next.js error documents are not public content pages.
const files = (await readdir("out", { recursive: true, encoding: "utf8" }))
  .filter((file) => file.endsWith(".html"))
  .filter((file) => !file.split("/").some((part) => part.startsWith("_")))
  .filter((file) => !["404.html", "500.html"].includes(file));
assert(files.length > 0, "No exported pages found; run pnpm build first");

const routes = files.map(
  (file) =>
    `/${file.replace(/(?:^|\/)index\.html$/, "").replace(/\.html$/, "")}`.replace(
      /\/$/,
      "",
    ) || "/",
);
// Match the clean-URL mapping used by static hosting. No SPA fallback.
const server = createServer(async (request, response) => {
  const path = decodeURIComponent(
    new URL(request.url ?? "/", "http://localhost").pathname,
  );
  const file = path === "/" ? "index.html" : `${path.slice(1)}.html`;
  try {
    const body = await readFile(join("out", file)).catch(() =>
      readFile(join("out", path.slice(1), "index.html")),
    );
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end();
  }
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
const address = server.address();
assert(address && typeof address !== "string");
try {
  await Promise.all(
    routes.map(async (route) => {
      const response = await fetch(`http://127.0.0.1:${address.port}${route}`, {
        redirect: "manual",
        signal: AbortSignal.timeout(10_000),
      });
      await response.arrayBuffer();
      assert.equal(response.status, 200, `${route} must return HTTP 200`);
      console.log(`200 ${route}`);
    }),
  );
  console.log(`HTTP smoke check passed for all ${routes.length} public pages.`);
} finally {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
    server.closeAllConnections();
  });
}
