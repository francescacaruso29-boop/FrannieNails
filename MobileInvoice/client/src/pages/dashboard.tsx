import { AdminHamburgerMenu } from "@/components/admin-hamburger-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Send, Trash2, X } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";


interface PhotoWithClient {
  id: number;
  clientId: number;
  imageUrl: string;
  description: string;
  nailStyle: string;
  uploadedAt: string;
  clientName?: string;
}

interface Comment {
  id: number;
  content: string;
  clientName: string;
  clientId: number;
  createdAt: string;
}

export default function Dashboard() {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithClient | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current client from localStorage
  const getCurrentClient = () => {
    const savedData = localStorage.getItem('frannie-client-data');
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (error) {
        return null;
      }
    }
    return null;
  };

  const currentClient = getCurrentClient();

  // Fetch current client from database to get ID
  const { data: dbClientData } = useQuery({
    queryKey: ["/api/clients/by-code", currentClient?.uniqueCode],
    queryFn: async () => {
      if (!currentClient?.uniqueCode) return null;
      const response = await fetch(`/api/clients/by-code/${currentClient.uniqueCode}`);
      return response.json();
    },
    enabled: !!currentClient?.uniqueCode,
  });

  const dbClient = (dbClientData as any)?.client;

  // Fetch approved photos
  const { data: photosData } = useQuery({
    queryKey: ["/api/photos/approved"],
  });

  // Fetch likes for a photo
  const { data: likesData } = useQuery({
    queryKey: [`/api/photos/${selectedPhoto?.id}/likes`],
    enabled: !!selectedPhoto,
  });

  // Check if current client liked the photo
  const { data: likedData } = useQuery({
    queryKey: [`/api/photos/${selectedPhoto?.id}/liked/${dbClient?.id || 0}`],
    enabled: !!selectedPhoto && !!dbClient,
  });

  // Fetch comments for selected photo
  const { data: commentsData } = useQuery({
    queryKey: [`/api/photos/${selectedPhoto?.id}/comments`],
    enabled: !!selectedPhoto,
  });

  // Like/Unlike mutation
  const likeMutation = useMutation({
    mutationFn: async (photoId: number) => {
      if (!dbClient) throw new Error("Client not found");
      const response = await apiRequest("POST", `/api/photos/${photoId}/like`, {
        clientId: dbClient.id
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/photos/${selectedPhoto?.id}/likes`] });
      queryClient.invalidateQueries({ queryKey: [`/api/photos/${selectedPhoto?.id}/liked/${dbClient?.id || 0}`] });
    },
  });

  // Add comment mutation
  const commentMutation = useMutation({
    mutationFn: async ({ photoId, content }: { photoId: number; content: string }) => {
      if (!dbClient) throw new Error("Client not found");
      const response = await apiRequest("POST", `/api/photos/${photoId}/comments`, {
        clientId: dbClient.id,
        content
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/photos/${selectedPhoto?.id}/comments`] });
      setNewComment("");
      toast({
        title: "Commento aggiunto",
        description: "Il tuo commento è stato pubblicato",
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      if (!currentClient) throw new Error("Client not found");
      const response = await apiRequest("DELETE", `/api/comments/${commentId}`, {
        clientId: currentClient.id
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/photos/${selectedPhoto?.id}/comments`] });
    },
  });

  const photos = (photosData as any)?.photos || [];
  const likesCount = (likesData as any)?.count || 0;
  const hasLiked = (likedData as any)?.liked || false;
  const comments = (commentsData as any)?.comments || [];

  // Enhance photos with client names
  const enhancedPhotos = photos.map((photo: PhotoWithClient) => ({
    ...photo,
    clientName: getClientNameFromId(photo.clientId)
  }));

  function getClientNameFromId(clientId: number): string {
    // For now, use mock names - in real app would fetch from clients table
    const names = ["Giulia", "Sara", "Laura", "Martina", "Anna", "Elena", "Francesca", "Valentina", "Arianna"];
    return names[clientId % names.length] || "Cliente";
  }

  const handleLike = () => {
    if (selectedPhoto) {
      likeMutation.mutate(selectedPhoto.id);
    }
  };

  const handleComment = () => {
    if (selectedPhoto && newComment.trim()) {
      commentMutation.mutate({ photoId: selectedPhoto.id, content: newComment.trim() });
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 relative">
      <AdminHamburgerMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />
      
      <div className="container mx-auto px-4 pt-20 pb-24">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-normal mb-2" style={{ fontFamily: 'Voga, serif', color: '#d38a77' }}>
            Galleria delle Clienti
          </h1>
        </div>

        {/* Instagram Style Gallery */}
        <div className="space-y-6 max-w-md mx-auto">
          {enhancedPhotos.map((photo: PhotoWithClient) => (
            <Dialog key={photo.id}>
              <DialogTrigger asChild>
                <Card 
                  className="bg-white border-0 shadow-lg rounded-xl overflow-hidden cursor-pointer transform transition-all duration-200 hover:shadow-xl"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  {/* Instagram Post Header */}
                  <div className="flex items-center p-4 border-b border-gray-100">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ background: 'linear-gradient(135deg, #d38a77 0%, #c67967 100%)' }}>
                      {photo.clientName?.charAt(0) || 'C'}
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold text-gray-900 text-sm">{photo.clientName || 'Cliente'}</p>
                      <p className="text-xs text-gray-500">Frannie Nail Salon</p>
                    </div>
                    <div className="ml-auto">
                      <div className="text-gray-400">⋯</div>
                    </div>
                  </div>
                  
                  {/* Instagram Photo */}
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={photo.imageUrl}
                      alt={`Nails by ${photo.clientName}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Instagram Actions Bar */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4">
                        <Heart className="w-6 h-6" style={{ color: '#d38a77' }} />
                        <MessageCircle className="w-6 h-6" style={{ color: '#d38a77' }} />
                      </div>
                    </div>
                    
                    {/* Description */}
                    {photo.description && (
                      <p className="text-sm text-gray-800 mb-2">
                        <span className="font-semibold">{photo.clientName || 'Cliente'}</span> {photo.description}
                      </p>
                    )}
                    
                    <p className="text-xs text-gray-500">Tocca per vedere i commenti</p>
                  </div>
                </Card>
              </DialogTrigger>

              <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-center" style={{ color: '#d38a77' }}>
                    {photo.clientName}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Photo */}
                  <div className="aspect-square overflow-hidden rounded-lg">
                    <img
                      src={photo.imageUrl}
                      alt={`Nails by ${photo.clientName}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Description */}
                  {photo.description && (
                    <p className="text-sm text-gray-600 text-center">{photo.description}</p>
                  )}

                  {/* Like and Comment buttons */}
                  <div className="flex items-center justify-between border-t pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLike}
                      disabled={likeMutation.isPending}
                      className={`flex items-center gap-2 ${hasLiked ? 'text-red-500' : 'text-gray-500'}`}
                    >
                      <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
                      <span>{likesCount}</span>
                    </Button>
                    
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-500">
                      <MessageCircle className="w-5 h-5" />
                      <span>{comments.length}</span>
                    </Button>
                  </div>

                  {/* Comments Section - Fixed Height & Better Visibility */}
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Commenti ({comments.length})</h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto mb-4 border rounded-lg p-3 bg-gray-50">
                      {comments.length === 0 ? (
                        <p className="text-center text-gray-500 text-sm py-4">Nessun commento ancora</p>
                      ) : (
                        comments.map((comment: Comment) => (
                          <div key={comment.id} className="flex justify-between items-start bg-white rounded-lg p-3 shadow-sm">
                            <div className="flex-1">
                              <p className="font-medium text-sm" style={{ color: '#d38a77' }}>{comment.clientName}</p>
                              <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                            </div>
                            {currentClient && comment.clientId === currentClient.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteCommentMutation.mutate(comment.id)}
                                className="text-red-500 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Comment - Better Positioned */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Scrivi un commento..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                        className="flex-1 border-2 border-pink-200 focus:border-pink-400"
                      />
                      <Button
                        onClick={handleComment}
                        disabled={!newComment.trim() || commentMutation.isPending}
                        size="sm"
                        style={{ backgroundColor: '#d38a77' }}
                        className="text-white px-4"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>

      </div>
    </div>
  );
}