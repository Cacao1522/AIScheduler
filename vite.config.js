import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist", // ← ビルドの出力先をAzureの期待するパスに変更
  },
});
