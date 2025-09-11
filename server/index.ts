import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import { startReminderService } from "./notifications";
import http from "http";
import path from "path";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// file caricati
app.use("/uploads", express.static("public/uploads"));

// (opzionale) test rapido
app.get("/ping", (_req, res) => res.send("pong"));

// log API
app.use((req, res, next) => {
  const start = Date.now();
  const p = req.path;
  let captured: any;
  const orig = res.json;
  res.json = function (b, ...args) { captured = b; return orig.apply(res, [b, ...args]); };
  res.on("finish", () => {
    if (p.startsWith("/api")) {
      let line = `${req.method} ${p} ${res.statusCode} in ${Date.now()-start}ms`;
      if (captured) line += ` :: ${JSON.stringify(captured)}`;
      if (line.length > 80) line = line.slice(0,79)+"…";
      log(line);
    }
  });
  next();
});

(async () => {
  registerRoutes(app);

  const server = http.createServer(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ message: err.message || "Internal Server Error" });
  });

  // DEV = Vite; PROD = serve il sito vero costruito
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    const clientPath = path.join(process.cwd(), "dist", "client");
    app.use(express.static(clientPath));
    // catch-all: manda l'index del client
    app.get("*", (_req, res) => res.sendFile(path.join(clientPath, "index.html")));
  }

  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`✅ serving on port ${port}`);
    startReminderService();
  });
})();
