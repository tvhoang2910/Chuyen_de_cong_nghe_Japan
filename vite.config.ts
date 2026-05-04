import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Auth service — dev uses relative path /api/v1/auth via Vite proxy to localhost:8080
      "/api/v1/auth": {
        target: "http://localhost:8080",
        changeOrigin: true,
        // Vite env vars baked at build time override defaults, but proxy still routes via relative paths
      },
      // Exam service — dev uses relative path /api/v1/exam via Vite proxy to localhost:8082
      "/api/v1/exam": {
        target: "http://localhost:8082",
        changeOrigin: true,
      },
      // Search service — dev uses relative path /api/v1/search via Vite proxy to localhost:8086
      "/api/v1/search": {
        target: "http://localhost:8086",
        changeOrigin: true,
      },
      // Analytics: Nginx rewrites /api/v1/analytics/ -> /api/v1/exam/analytics/ (deploy).
      // Vite mirrors this: proxy to exam service with the same rewrite.
      "/api/v1/analytics": {
        target: "http://localhost:8082",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/api\/v1\/analytics/, "/api/v1/exam/analytics"),
      },
      // Study service — dev uses relative path /api/v1/study via Vite proxy to localhost:8085
      "/api/v1/study": {
        target: "http://localhost:8085",
        changeOrigin: true,
      },
      // Community service — dev uses relative path /api/v1/community via Vite proxy to localhost:8084
      "/api/v1/community": {
        target: "http://localhost:8084",
        changeOrigin: true,
      },
      // Notification service
      "/api/v1/notification": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
      "/api/v1/notifications": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
      // Catch-all for any other /api/* routes (keep last so it does not shadow specific services)
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router-dom")
            ) {
              return "react-vendor";
            }
            if (id.includes("framer-motion")) {
              return "motion-vendor";
            }
            if (id.includes("recharts")) {
              return "charts-vendor";
            }
            if (
              id.includes("axios") ||
              id.includes("zod") ||
              id.includes("react-hook-form")
            ) {
              return "data-vendor";
            }
            return "vendor";
          }
          return undefined;
        },
      },
    },
  },
});
