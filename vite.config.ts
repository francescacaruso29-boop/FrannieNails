import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Dì a Vite che la root è la cartella client
  root: "client",
  plugins: [react()],
  build: {
    // Metti la build fuori da client, in dist/client
    outDir: "../dist/client",
    emptyOutDir: true
  },
  server: { port: 3000 }
});
