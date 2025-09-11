import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'wouter';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (requireAdmin) {
      // 🔒 AUTENTICAZIONE SICURA ADMIN
      // Rimuovo auto-login per sicurezza
      console.log('🔒 Verifica autenticazione admin...');
      
      // Sistema di autenticazione originale (per produzione)
      const adminAuth = localStorage.getItem('adminAuth');
      const adminAuthTime = localStorage.getItem('adminAuthTime');
      
      if (adminAuth === 'true' && adminAuthTime) {
        const authTime = parseInt(adminAuthTime);
        const now = Date.now();
        const authAge = now - authTime;
        
        // Keep admin logged in for 24 hours
        if (authAge < 24 * 60 * 60 * 1000) {
          setIsAuthenticated(true);
        } else {
          // Clear expired auth
          console.warn('🚨 Sessione admin scaduta, redirect al login');
          localStorage.removeItem('adminAuth');
          localStorage.removeItem('adminAuthTime');
          setIsAuthenticated(false);
          setLocation('/');
        }
      } else {
        console.warn('🚨 Accesso admin negato, credenziali non valide');
        setIsAuthenticated(false);
        setLocation('/');
      }
    } else {
      setIsAuthenticated(true);
    }
  }, [requireAdmin, setLocation]);

  // Mostra loader durante verifica autenticazione
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verifica autenticazione...</p>
        </div>
      </div>
    );
  }

  // Se è richiesta l'auth admin ma l'utente non è autenticato, non renderizzare nulla (il redirect è gestito sopra)
  if (requireAdmin && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}