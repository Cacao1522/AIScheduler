import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "js/dist", // ← ビルドの出力先をAzureの期待するパスに変更
  },
});
