import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100">
      <Card className="w-full max-w-md mx-4 bg-white/90 backdrop-blur-sm border-pink-200 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8" style={{ color: '#d38a77' }} />
            <h1 className="text-2xl font-bold" style={{ color: '#d38a77' }}>404 - Pagina non trovata</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            La pagina che stai cercando non esiste.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
