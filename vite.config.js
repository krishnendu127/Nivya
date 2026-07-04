import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const snapshotPath = resolve(import.meta.dirname, "data/screener_snapshot.json");

/** Serve MFapi snapshot to the UI when BFF is down (dev + production build). */
function screenerSnapshotPlugin() {
  return {
    name: "screener-snapshot",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split("?")[0] !== "/data/screener_snapshot.json") return next();
        if (!existsSync(snapshotPath)) {
          res.statusCode = 404;
          res.end('{"error":"Run npm run screener:build"}');
          return;
        }
        res.setHeader("Content-Type", "application/json");
        res.end(readFileSync(snapshotPath));
      });
    },
    generateBundle() {
      if (!existsSync(snapshotPath)) return;
      this.emitFile({
        type: "asset",
        fileName: "data/screener_snapshot.json",
        source: readFileSync(snapshotPath),
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), screenerSnapshotPlugin()],
  server: {
    proxy: {
      "/v1": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
