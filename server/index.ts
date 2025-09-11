import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { startReminderService } from "./notifications";
import http from "http";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// File caricati
app.use("/uploads", express.static("public/uploads"));

// Test rapido (puoi lasciarlo, non lo vedranno le clienti)
app.get("/ping", (_req, res) => res.send("pong"));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });

  next();
});

(async () => {
  registerRoutes(app);

  const server = http.createServer(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Server error:", err.message);
    res.status(status).json({ message });
  });

  // 👇 IMPORTANTE:
  // - In sviluppo usa Vite (hot reload).
  // - In produzione SERVE il sito vero (cartella build del client).
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app); // ✅ mostra il sito vero
  }

  // Porta per Render
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;

  server.listen(
    { port, host: "0.0.0.0", reusePort: true },
    () => {
      log(`✅ serving on port ${port}`);
      startReminderService();
    }
  );
})();
