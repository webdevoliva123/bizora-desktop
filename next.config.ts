import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server (own minimal node_modules) for the desktop installer.
  output: "standalone",

  // Native module: must stay a real require(), rebuilt for Electron.
  serverExternalPackages: ["better-sqlite3"],

  // Never ship the developer's own database/uploads inside an installer.
  outputFileTracingExcludes: {
    "*": [
      "data/**",
      "business-files/**",
      "release/**",
      "electron/**",
      "electron-dist/**",
      "README.md",
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
