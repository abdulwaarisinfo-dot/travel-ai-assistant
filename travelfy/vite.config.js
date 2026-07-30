import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // During local `npm run dev`, forward /api calls to the Express server
      "/api": "http://localhost:3001",
    },
  },
  build: {
    outDir: "dist",
  },
});
