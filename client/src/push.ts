// client/src/push.ts
export async function subscribeToPush() {
  // Controlli base
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push non supportato dal browser.");
    return;
  }

  // Aspetta che il Service Worker sia pronto
  const reg = await navigator.serviceWorker.ready;

  // Public Key passata dal build (Render) -> VITE_PUBLIC_VAPID_KEY
  const vapidKey = import.meta.env.VITE_PUBLIC_VAPID_KEY as string;
  if (!vapidKey) {
    console.error("Manca VITE_PUBLIC_VAPID_KEY");
    return;
  }

  // Converte base64 url-safe in Uint8Array
  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const arr = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
    return arr;
  }

  // Chiedi permesso
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.warn("Permesso notifiche non concesso.");
    return;
  }

  // Crea la subscription
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

  // Invia la subscription al server (lo faremo allo Step 3)
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  }).catch(() => {
    // Se la rotta non esiste ancora, è ok: la aggiungiamo nello Step 3
    console.warn("La rotta /api/push/subscribe non è ancora attiva (ok per ora).");
  });

  console.log("✅ Subscription creata.");
}
