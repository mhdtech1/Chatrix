import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const siteBase = process.env.SITE_BASE || "/";

export default defineConfig({
  base: siteBase,
  plugins: [react()],
});
