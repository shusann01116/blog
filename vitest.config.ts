import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: ["./tests/unit/setup.ts"],
    include: ["tests/unit/**/*.test.ts"],
  },
});
