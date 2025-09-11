import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { startReminderService } from "./notifications";

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static('public/uploads'));

// 🔹 Rotta di test
app.get("/ping", (_req, res) => {
  res.send("pong");
});

// 🔹 Rotta home fallback (se non trova index.html)
app.get("/", (_req, res) => {
  res.type("text/plain").send("FrannieNails API is running ✅ (fallback)");
});

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
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  registerRoutes(app);

  const server = await import('http').then(http => http.createServer(app));

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error('Server error:', err.message);
    res.status(status).json({ message });
  });

  // In sviluppo usa Vite, in produzione serve i file statici
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app); // ✅ riattivato: mostrerà il sito vero
  }

  // Porta: usa quella di Render o 5000 in locale
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  server.listen(
    { port, host: "0.0.0.0" },
    () => {
      log(`✅ serving on port ${port}`);
      startReminderService();
    }
  );
})();

