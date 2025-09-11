import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Menu, 
  X, 
  Calendar, 
  Users, 
  Settings, 
  MessageSquare, 
  Camera, 
  Bell,
  LogOut,
  Home,
  Clock,
  FileText,
  Shield,
  Euro,
  CalendarDays,
  Smartphone,
  MessageCircle,
  Package,
  ArrowLeftRight,
  ClipboardCheck
} from 'lucide-react';
import { Link } from 'wouter';
import { useQuery } from "@tanstack/react-query";

interface AdminHamburgerMenuProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function AdminHamburgerMenu({ isOpen, onToggle }: AdminHamburgerMenuProps) {
  // Query per le notifiche non lette
  const { data: unreadNotifications } = useQuery({
    queryKey: ["/api/admin/notifications/unread"],
    refetchInterval: 30000 // Ricarica ogni 30 secondi
  });

  const unreadCount = (unreadNotifications as any)?.notifications?.length || 0;

  const handleLogout = async () => {
    try {
      // Chiama API per invalidare sessione server
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.log('Logout dal server fallito, continuo con pulizia locale');
    }
    
    // Pulisci localStorage usando il sistema originale
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminAuthTime');
    localStorage.removeItem('frannie-client-data');
    localStorage.removeItem('frannie-remember-data');
    localStorage.removeItem('frannie-profile-image');
    localStorage.removeItem('frannie-header-image');
    localStorage.removeItem('frannie_rapid_bookings');
    
    // Redirect alla home
    window.location.href = '/';
  };
  const menuItems = [
    { 
      icon: Home, 
      label: 'Dashboard', 
      href: '/admin'
    },
    { 
      icon: Users, 
      label: 'Gestione Clienti', 
      href: '/admin-clients'
    },
    { 
      icon: Camera, 
      label: 'Galleria', 
      href: '/admin-gallery'
    },
    { 
      icon: ArrowLeftRight, 
      label: 'Scambi', 
      href: '/admin-swaps'
    },
    { 
      icon: Package, 
      label: 'Inventario', 
      href: '/admin-inventory'
    },
    { 
      icon: MessageCircle, 
      label: 'WhatsApp', 
      href: '/admin-whatsapp-reminders'
    },
    { 
      icon: ClipboardCheck, 
      label: 'Controlli Pre-Appuntamento', 
      href: '/admin-pre-checks'
    },
    { 
      icon: Euro, 
      label: 'Guadagni Mensili', 
      href: '/monthly-earnings'
    },
    { 
      icon: Shield, 
      label: 'Backup', 
      href: '/admin-backup'
    }
  ];

  return (
    <>
      {/* Hamburger Button */}
      <button 
        onClick={onToggle}
        className="fixed top-6 left-6 z-[80] bg-white/50 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white/70 transition-colors"
      >
        <div className="flex flex-col space-y-1">
          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#F4ACB7' }}></div>
          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#F4ACB7' }}></div>
          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#F4ACB7' }}></div>
        </div>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[60] transition-opacity duration-300"
          onClick={onToggle}
        />
      )}

      {/* Menu Dropdown */}
      {isOpen && (
        <div className="fixed top-20 left-6 w-64 max-h-[calc(100vh-6rem)] bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 z-[70] overflow-y-auto">
          <div className="p-4 border-b border-gray-200/50">
            <h3 className="font-semibold text-gray-800">Menu Admin</h3>
          </div>
          
          <div className="py-2">
            {menuItems.map((item, index) => {
              const IconComponent = item.icon;
              const colors = [
                'bg-pink-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400', 
                'bg-yellow-400', 'bg-orange-400', 'bg-indigo-400', 'bg-teal-400', 'bg-red-400'
              ];
              
              return (
                <Link key={item.href} href={item.href}>
                  <button 
                    className="w-full text-left px-4 py-3 hover:bg-pink-50/80 transition-colors flex items-center space-x-3"
                    onClick={onToggle}
                  >
                    <IconComponent className={`w-4 h-4 text-gray-600`} />
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-gray-700 font-medium">{item.label}</span>
                      {item.label === 'Scambi' && unreadCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="bg-red-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 flex items-center justify-center ml-2"
                        >
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                  </button>
                </Link>
              );
            })}

            {/* Divider */}
            <div className="border-t border-gray-200/50 my-2"></div>

            {/* Logout Button */}
            <button 
              className="w-full text-left px-4 py-3 hover:bg-red-50/80 transition-colors flex items-center space-x-3"
              onClick={() => {
                handleLogout();
                onToggle();
              }}
            >
              <LogOut className="w-4 h-4 text-red-600" />
              <span className="text-red-600 font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}