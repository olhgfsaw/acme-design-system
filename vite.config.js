import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import frames from "./build/vite-plugin-frames.js";

export default defineConfig({
  plugins: [frames(), tailwindcss()],
  server: { open: true },
});
