import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["server/**/*.test.ts", "client/src/**/*.test.ts"],
    environment: "node",
  },
  // Mirrors the aliases in vite.config.ts so client modules that import via
  // "@/..." can be unit tested.
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
});
