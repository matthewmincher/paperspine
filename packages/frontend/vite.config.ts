import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const apiTarget = env.VITE_API_URL;

  return {
    plugins: [react()],
    server: apiTarget
      ? {
          proxy: {
            "/books": apiTarget,
            "/tags": apiTarget,
            "/shelves": apiTarget,
          },
        }
      : {},
  };
});
