import { useState } from "react";
import { ArrowLeft, Bell, Users, Calendar, Camera, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface AdminNotification {
  id: number;
  type: 'swap_request' | 'appointment' | 'photo_upload' | 'message';
  message: string;
  timestamp: string;
  clientId?: number;
  status: string;
}

interface DailySummary {
  date: string;
  appointments: number;
  swapRequests: number;
  photosUploaded: number;
  messagesReceived: number;
}

export default function AdminNotificationsPage() {
  const [, setLocation] = useLocation();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['/api/admin/notifications'],
    queryFn: async () => {
      const response = await fetch('/api/admin/notifications');
      const result = await response.json();
      return result.success ? result.notifications : [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch daily summary
  const { data: summary } = useQuery({
    queryKey: ['/api/admin/daily-summary'],
    queryFn: async () => {
      const response = await fetch('/api/admin/daily-summary');
      const result = await response.json();
      return result.success ? result.summary : null;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'swap_request': return <Users className="w-5 h-5 text-purple-500" />;
      case 'appointment': return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'photo_upload': return <Camera className="w-5 h-5 text-green-500" />;
      case 'message': return <MessageSquare className="w-5 h-5 text-orange-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'accepted': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'approved': return 'bg-blue-500';
      case 'read': return 'bg-gray-400';
      case 'unread': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'In Attesa';
      case 'accepted': return 'Accettato';
      case 'rejected': return 'Rifiutato';
      case 'approved': return 'Approvato';
      case 'read': return 'Letto';
      case 'unread': return 'Non Letto';
      case 'booked': return 'Prenotato';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-300 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento notifiche...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-pink-100 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation("/admin-dashboard-modern")}
              className="p-2 hover:bg-pink-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5 text-pink-600" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Centro Notifiche Admin
              </h1>
              <p className="text-gray-600 text-sm">Monitora tutte le attività delle tue clienti in tempo reale</p>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Live
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Daily Summary */}
        {summary && (
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <AlertCircle className="w-5 h-5 text-pink-500" />
                Riepilogo di Oggi - {new Date(summary.date).toLocaleDateString('it-IT')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{summary.appointments}</p>
                  <p className="text-sm text-blue-600">Appuntamenti</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-purple-700">{summary.swapRequests}</p>
                  <p className="text-sm text-purple-600">Scambi Richiesti</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-green-700">{summary.photosUploaded}</p>
                  <p className="text-sm text-green-600">Foto Caricate</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-orange-700">{summary.messagesReceived}</p>
                  <p className="text-sm text-orange-600">Messaggi</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications List */}
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Bell className="w-5 h-5 text-pink-500" />
              Attività Recenti ({notifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map((notification: AdminNotification, index: number) => (
                  <div key={`${notification.type}-${notification.id}-${index}`} 
                       className="flex items-start gap-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-100 hover:shadow-md transition-all">
                    
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          className={`${getStatusColor(notification.status)} text-white text-xs`}
                        >
                          {getStatusText(notification.status)}
                        </Badge>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(notification.timestamp).toLocaleDateString('it-IT', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0">
                      {notification.type === 'swap_request' && notification.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation('/admin-swaps')}
                          className="text-purple-600 border-purple-200 hover:bg-purple-50"
                        >
                          Gestisci
                        </Button>
                      )}
                      {notification.type === 'photo_upload' && !notification.status && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation('/admin-gallery')}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          Approva
                        </Button>
                      )}
                      {notification.type === 'message' && notification.status === 'unread' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation('/admin-messages')}
                          className="text-orange-600 border-orange-200 hover:bg-orange-50"
                        >
                          Rispondi
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna attività recente</h3>
                <p className="text-gray-600">Le notifiche delle attività delle clienti appariranno qui</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}