// Lazy Loading Components - Frannie NAILS
// Componenti caricati solo quando necessari per performance

import React, { Suspense } from 'react';
import { createLazyComponent } from '@/lib/performance-optimizer';

// 🔄 LOADING SPINNER OTTIMIZZATO
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px] bg-pink-50">
    <div className="text-center space-y-4">
      <div className="w-8 h-8 border-3 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto"></div>
      <p className="text-pink-700 font-medium">Caricamento...</p>
    </div>
  </div>
);

// 🏗️ WRAPPER SUSPENSE
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const LazyWrapper = ({ children, fallback = <LoadingSpinner /> }: LazyWrapperProps) => (
  <Suspense fallback={fallback}>
    {children}
  </Suspense>
);

// 📱 LAZY COMPONENTS ADMIN (Pesanti)
export const LazyAdminClients = createLazyComponent(() => import('@/pages/admin-clients'));
export const LazyAdminGallery = createLazyComponent(() => import('@/pages/admin-gallery'));
export const LazyAdminSwaps = createLazyComponent(() => import('@/pages/admin-swaps'));
export const LazyAdminStats = createLazyComponent(() => import('@/pages/admin-stats'));
export const LazyAdminInventory = createLazyComponent(() => import('@/pages/admin-inventory'));
export const LazyAdminBackup = createLazyComponent(() => import('@/pages/admin-backup'));
export const LazyAdminFinances = createLazyComponent(() => import('@/pages/admin-finances'));

// 👤 LAZY COMPONENTS CLIENT
export const LazyDashboard = createLazyComponent(() => import('@/pages/dashboard'));
export const LazyProfile = createLazyComponent(() => import('@/pages/profile'));
export const LazyCalendar = createLazyComponent(() => import('@/pages/calendar'));

// 🔧 LAZY UTILITY COMPONENTS
export const LazyNotificationTest = createLazyComponent(() => import('@/pages/notification-test'));
export const LazyClientDetail = createLazyComponent(() => import('@/pages/client-detail'));

// 📊 LAZY ADVANCED ADMIN FEATURES
export const LazyAdminAdvanced = createLazyComponent(() => import('@/pages/admin-advanced'));
export const LazyAdminDashboardSimple = createLazyComponent(() => import('@/pages/admin-dashboard-simple'));
export const LazyAdminNewDesign = createLazyComponent(() => import('@/pages/admin-new-design'));
export const LazyAdminCleanMinimal = createLazyComponent(() => import('@/pages/admin-clean-minimal'));

// 🎨 CUSTOM LOADING PER PAGINE SPECIFICHE
export const AdminLoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 to-pink-100">
    <div className="text-center space-y-6 p-8">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-pink-300 rounded-full animate-ping mx-auto"></div>
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-pink-900">Caricamento Panel Admin</h3>
        <p className="text-pink-700">Preparazione interfaccia avanzata...</p>
      </div>
    </div>
  </div>
);

export const ClientLoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50">
    <div className="text-center space-y-4 p-6">
      <div className="w-12 h-12 border-3 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto"></div>
      <div className="space-y-1">
        <h3 className="text-lg font-medium text-pink-900">Frannie NAILS</h3>
        <p className="text-pink-600 text-sm">Caricamento...</p>
      </div>
    </div>
  </div>
);

// 🎯 COMPONENT WRAPPERS CON LOADING SPECIFICO
export const AdminClientsMobile = () => (
  <LazyWrapper fallback={<AdminLoadingSpinner />}>
    <LazyAdminClients />
  </LazyWrapper>
);

export const AdminGalleryMobile = () => (
  <LazyWrapper fallback={<AdminLoadingSpinner />}>
    <LazyAdminGallery />
  </LazyWrapper>
);

export const DashboardMobile = () => (
  <LazyWrapper fallback={<ClientLoadingSpinner />}>
    <LazyDashboard />
  </LazyWrapper>
);

export const ProfileMobile = () => (
  <LazyWrapper fallback={<ClientLoadingSpinner />}>
    <LazyProfile />
  </LazyWrapper>
);

// 🚀 PRELOAD FUNCTIONS
export const preloadAdminComponents = () => {
  // Preload componenti admin più usati
  import('@/pages/admin-clients');
  import('@/pages/admin-gallery'); 
  import('@/pages/admin-swaps');
  console.log('🔄 Componenti admin preloadati');
};

export const preloadClientComponents = () => {
  // Preload componenti client più usati
  import('@/pages/dashboard');
  import('@/pages/calendar');
  import('@/pages/profile');
  console.log('🔄 Componenti client preloadati');
};