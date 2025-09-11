// server/push-routes.ts
import { Router } from "express";
import webpush from "web-push";

type PushSub = {
  endpoint: string;
  keys?: { p256dh?: string; auth?: string };
};

// ⚠️ In memoria (va bene per iniziare). Dopo possiamo spostare su Postgres.
const subscriptions: PushSub[] = [];

export function pushRouter() {
  const router = Router();

  // Configura web-push con VAPID presi dall'env (li hai già messi su Render)
  const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
  const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:admin@example.com";

  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  // Salva/aggiorna una subscription
  router.post("/subscribe", (req, res) => {
    const sub = req.body as PushSub;
    if (!sub?.endpoint) return res.status(400).json({ ok: false, error: "invalid subscription" });

    const i = subscriptions.findIndex((s) => s.endpoint === sub.endpoint);
    if (i === -1) subscriptions.push(sub);
    else subscriptions[i] = sub;

    return res.json({ ok: true });
  });

  // Invia notifica di prova a tutte le subscription salvate
  router.post("/test", async (_req, res) => {
    const payload = JSON.stringify({
      title: "Frannie Nails",
      body: "Notifica di prova 💅",
      url: "/"
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) => webpush.sendNotification(sub as any, payload))
    );

    return res.json({
      ok: true,
      sent: results.filter(r => r.status === "fulfilled").length,
      failed: results.filter(r => r.status === "rejected").length
    });
  });

  return router;
}
