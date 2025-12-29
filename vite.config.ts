import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  plugins: [
    wasm(), // Required for WASM loading
    nodePolyfills({
      exclude: ["fs"], // fs not available in browser
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
    react(),
  ],
  optimizeDeps: {
    include: [
      "buffer",
      "process",
      "crypto-browserify",
      "stream-browserify",
      "events",
      "ripple-binary-codec", // Fix CommonJS interop
      "@cosmjs/stargate", // Fix CommonJS interop
      "@solana/web3.js", // Fix CommonJS interop
    ],
    exclude: ["@vultisig/sdk"], // Let Vite handle SDK imports directly
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Polyfills for Node.js modules
      buffer: "buffer",
      crypto: "crypto-browserify",
      events: "events",
      path: "path-browserify",
      stream: "stream-browserify",
      util: "util",
      "node-fetch": "isomorphic-fetch",
    },
  },
  server: {
    allowedHosts: true,
  },
});
