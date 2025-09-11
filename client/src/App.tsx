import React from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageTransition } from "@/components/PageTransition";

// Pagine
import Welcome from "@/pages/welcome-new";
import DesignVariants from "@/pages/design-variants";
import ServicesPage from "@/pages/services";
import Dashboard from "@/pages/dashboard";
import CalendarPage from "@/pages/calendar";
import ProfilePage from "@/pages/profile";
import SettingsPage from "@/pages/settings";
import ClientDataPage from "@/pages/client-data";
import ClientCardPage from "@/pages/client-card";
import InventoryPage from "@/pages/inventory";
import AppointmentSwapPage from "@/pages/appointment-swap";
import { AdminDashboard } from "@/pages/admin-dashboard";
import AdminAdvanced from "@/pages/admin-advanced";
import AdminModern from "@/pages/admin-modern";
import AdminDashboardModern from "@/pages/admin-dashboard-modern";
import AdminDashboardClean from "@/pages/admin-dashboard-clean";
import AdminCleanMinimal from "@/pages/admin-clean-minimal";
import AdminNewDesign from "@/pages/admin-new-design";
import AdminDashboardNew from "@/pages/admin-dashboard-new";
import AdminDashboardSimple from "@/pages/admin-dashboard-simple";
import AdminSwaps from "@/pages/admin-swaps";
import AdminClients from "@/pages/admin-clients";
import ClientDetail from "@/pages/client-detail";
import AdminGallery from "@/pages/admin-gallery";
import AdminNotificationsPage from "@/pages/admin-notifications";
import AdminCalendarOverview from "@/pages/admin-calendar-overview";
import AdminCalendarClean from "@/pages/admin-calendar-clean";
import AdminWhatsAppReminders from "@/pages/admin-whatsapp-reminders";
import AdminFinances from "@/pages/admin-finances";
import AdminNotificationTest from "@/pages/admin-notification-test";
import NotificationTestPage from "@/pages/notification-test";
import AdminStats from "@/pages/admin-stats";
import AdminInventory from "@/pages/admin-inventory";
import AdminBackup from "@/pages/admin-backup";
import ClientSwapsPage from "@/pages/client-swaps";
import AdminPreChecks from "@/pages/admin-pre-checks";
import MonthlyEarnings from "@/pages/monthly-earnings";
import DailyEarningsInput from "@/pages/daily-earnings-input";
import NotFound from "@/pages/not-found";

// 🔔 push
import { subscribeToPush } from "./push";

// ----------------------
// Bottone per abilitare notifiche (solo su click)
// ----------------------
function PushToggle() {
  const [status, setStatus] = React.useState<"idle" | "ok" | "noperm" | "error">("idle");
  const [msg, setMsg] = React.useState("");

  // Mostra il bottone solo se le notifiche non sono già permesse
  const shouldShow =
    typeof Notification !== "undefined" && Notification.permission !== "granted";

  async function handleEnablePush() {
    try {
      // alcuni browser richiedono la richiesta permesso su gesto utente
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus("noperm");
        setMsg("Permesso negato/bloccato nel browser.");
        return;
      }
      await subscribeToPush();
      setStatus("ok");
      setMsg("Notifiche attivate ✅");
    } catch (e: any) {
      console.error(e);
      setStatus("error");
      setMsg(e?.message || "Errore attivazione notifiche");
    }
  }

  if (!shouldShow) return null;

  // Stile semplice e visibile in basso a destra
  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 9999,
        display: "flex",
        gap: 8,
        alignItems: "center",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <button
        onClick={handleEnablePush}
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          border: "none",
          cursor: "pointer",
          background: "#ff9a8b",
          color: "#111",
          fontWeight: 600,
          boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
        }}
      >
        Attiva notifiche 🔔
      </button>
      {status !== "idle" && (
        <span style={{ fontSize: 12, color: "#333" }}>
          {status === "ok" ? "Attivate ✅" : msg}
        </span>
      )}
    </div>
  );
}

// ----------------------
// Router come ce l’avevi
// ----------------------
function Router() {
  return (
    <PageTransition>
      <Switch>
        <Route path="/" component={Welcome} />
        <Route path="/design" component={DesignVariants} />
        <Route path="/login" component={Welcome} />
        <Route path="/services" component={ServicesPage} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/calendar" component={CalendarPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/client-data" component={ClientDataPage} />
        <Route path="/client-card" component={ClientCardPage} />
        <Route path="/inventory" component={InventoryPage} />
        <Route path="/swap" component={AppointmentSwapPage} />

        <Route path="/admin">
          {() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboardSimple />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/admin-modern">
          {() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminNewDesign />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/admin-clean">
          {() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminCleanMinimal />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/admin-advanced">
          {() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminAdvanced />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/admin-swaps">
          {() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminSwaps />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/admin-clients">
          {() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminClients />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/client-detail/:id">
          {() => (
            <ProtectedRoute requireAdmin={true}>
              <ClientDetail />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/admin-gallery">
          {() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminGallery />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/admin-notifications">
          {() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminNotificationsPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/admin-calendar-overview">
          {() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminCalendarClean />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/admin-finances">
          {() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminFinances />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/admin-stats">
          {() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminStats />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/admin-inventory">
          {() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminInventory />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/admin-backup">
          {() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminBackup />
            </ProtectedRoute>
          )}
        </Route>

        <Route path="/test-notifications" component={NotificationTestPage} />
        <Route path="/admin-whatsapp-reminders">
          {() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminWhatsAppReminders />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/admin-notification-test">
          {() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminNotificationTest />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/notification-test" component={NotificationTestPage} />
        <Route path="/client-swaps" component={ClientSwapsPage} />
        <Route path="/admin-pre-checks">
          {() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminPreChecks />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/monthly-earnings">
          {() => (
            <ProtectedRoute requireAdmin={true}>
              <MonthlyEarnings />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/daily-earnings-input">
          {() => (
            <ProtectedRoute requireAdmin={true}>
              <DailyEarningsInput />
            </ProtectedRoute>
          )}
        </Route>

        <Route component={NotFound} />
      </Switch>
    </PageTransition>
  );
}

function App() {
  // 🔒 Avvia servizi interni
  React.useEffect(() => {
    import("./lib/backup-service").then(() => {
      console.log("🔒 Sistema backup automatico avviato");
    });
    import("./lib/mobile-optimizer").then(({ initMobileOptimizations }) => {
      initMobileOptimizations();
    });
    import("./lib/performance-optimizer").then(
      ({ initPerformanceOptimizations, setPerformanceMonitor }) => {
        const monitor = initPerformanceOptimizations(queryClient);
        setPerformanceMonitor(monitor);
      }
    );
    import("./lib/notification-system").then(({ initNotificationSystem }) => {
      initNotificationSystem();
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
      {/* 🔔 Bottone per attivare le notifiche (solo se non sono già permesse) */}
      <PushToggle />
    </QueryClientProvider>
  );
}

export default App;
