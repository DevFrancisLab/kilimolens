import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import * as tanstackRouterPlugin from "@tanstack/router-plugin/vite";
const tanstackRouter = (tanstackRouterPlugin as any).default ?? (tanstackRouterPlugin as any).tanstackRouter ?? tanstackRouterPlugin;
// Import the TanStack Start plugin defensively in case of named/default export differences.
import * as tanstackStartPlugin from "@tanstack/react-start/plugin/vite";
const tanstackStart = (tanstackStartPlugin as any).default ?? (tanstackStartPlugin as any).tanstackStart ?? tanstackStartPlugin;

// Standard Vite config using TanStack Start plugin for SSR.
// Keeps server entry at `src/server.ts` and preserves existing dev server port.
export default defineConfig({
  plugins: [
    // Router plugin must come before JSX/React transformation plugins.
    tanstackRouter(),
    // Configure TanStack Start plugin for SSR/Nitro integration. Keep before React.
    tanstackStart({
      server: { entry: "src/server" },
    }),
    // JSX transform should come after router/start plugins.
    react(),
    tsconfigPaths(),
  ],
  server: {
    port: 5173,
  },
});
