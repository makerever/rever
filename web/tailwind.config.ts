import type { Config } from "tailwindcss";
import sharedConfig from "@rever/tailwind-config";

const config: Config = {
  // Use the shared config as a base
  ...sharedConfig,
  // Override the content property to include the web project's files
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../packages/*/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;
