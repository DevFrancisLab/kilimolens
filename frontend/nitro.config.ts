import { defineNitroConfig } from "nitro/config";

// Minimal Nitro config targeting Vercel for SSR deployment.
export default defineNitroConfig({
  preset: "vercel",
  // Ensure Nitro places Vercel-compatible output where Vercel expects it.
  output: {
    dir: ".vercel/output",
  },
});
