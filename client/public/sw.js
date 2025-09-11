// Attiva subito e prendi controllo
self.addEventListener("install", (event) => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Gestione messaggi push
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Notifica", body: event.data.text() };
  }

  const options = {
    body: data.body || "",
    icon: "/favicon.ico",   // assicurati che esista in client/public
    badge: "/favicon.ico",  // idem
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/", // dove aprire quando si clicca
      dateOfArrival: Date.now(),
      primaryKey: data.pk || 1
    },
    actions: [
      { action: "explore", title: "Apri",  icon: "/favicon.ico" },
      { action: "close",   title: "Chiudi", icon: "/favicon.ico" }
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title || "Frannie Nails", options));
});

// Click sulla notifica
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || "/";
  if (event.action === "close") return;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Se la tua app è già aperta, focus su quella
      for (const client of clientList) {
        if ("focus" in client && new URL(client.url).pathname === targetUrl) {
          return client.focus();
        }
      }
      // Altrimenti apri una nuova finestra
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
