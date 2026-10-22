import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import frames from "./build/vite-plugin-frames.js";

export default defineConfig({
  // BASE is set by the GitHub Pages workflow (the site lives under /<repo>/); locally it is "/".
  base: process.env.BASE || "/",
  plugins: [frames(), tailwindcss()],
  server: { open: true },
});
