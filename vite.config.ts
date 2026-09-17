import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  server: { port: 3101 },
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart({
      prerender: { enabled: true, failOnError: true, crawlLinks: false },
      pages: [{ path: "/" }],
    }),
    react(),
  ],
});
