import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  base: "./",
  // 배포본은 html 하나만 열면 바로 실행되어야 하므로 JS/CSS를 모두 index.html에 인라인한다.
  plugins: [react(), viteSingleFile()],
});
