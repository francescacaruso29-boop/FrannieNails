import { useState } from "react";
import { AdminHamburgerMenu } from "@/components/admin-hamburger-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
// Ultra-lightweight CSS gradient background - no video loading delays
const fastBackground = "linear-gradient(135deg, #f8f0ef 0%, #edd5d2 30%, #e4c0bb 60%, #d38a77 100%)";

const services = [
  {
    id: 1,
    name: "Gel"
  },
  {
    id: 2,
    name: "Semipermanente"
  },
  {
    id: 3,
    name: "Ricostruzione"
  },
  {
    id: 4,
    name: "Semipermanente Piedi"
  },
  {
    id: 5,
    name: "Epilazione"
  },
  {
    id: 6,
    name: "Ceretta Brasiliana"
  },
  {
    id: 7,
    name: "Laminazione Ciglia"
  },
  {
    id: 8,
    name: "Trucco"
  }
];

export default function ServicesPage() {
  const [, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleBookService = (serviceName: string) => {
    // Redirect to calendar with pre-selected service
    setLocation("/calendar");
  };

  return (
    <div 
      className="h-screen overflow-hidden relative"
      style={{ background: fastBackground }}
    >
      <AdminHamburgerMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />
      
      {/* Decorative pattern overlay for depth */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-white/20 blur-xl"></div>
        <div className="absolute top-40 right-16 w-24 h-24 rounded-full bg-white/15 blur-lg"></div>
        <div className="absolute bottom-32 left-20 w-20 h-20 rounded-full bg-white/25 blur-lg"></div>
      </div>
      
      <div className="h-full flex flex-col max-w-md mx-auto relative z-10">
        {/* Header spacer - no video, fast loading */}
        <div className="pt-16 pb-4">
          <h1 className="text-center text-white text-2xl font-bold tracking-wide">
            Servizi Disponibili
          </h1>
        </div>
        
        {/* Services Grid - Two Columns Aesthetic Design */}
        <div className="flex-1 p-4 grid grid-cols-2 gap-3 content-center">
          {services.map((service, index) => (
            <div 
              key={service.id}
              className="bg-white/15 backdrop-blur-md border border-white/20 rounded-lg p-3"
            >
              <div className="text-center">
                {/* Service name with decorative line */}
                <div>
                  <h3 className="text-white font-bold text-sm tracking-wide mb-1">
                    {service.name}
                  </h3>
                  <div className="w-8 h-0.5 bg-white/40 mx-auto"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Bottom decorative elements */}
        <div className="flex justify-center items-center space-x-4 pb-6">
          <div className="w-8 h-0.5 bg-white/30"></div>
          <div className="text-white/50">⋆</div>
          <div className="w-8 h-0.5 bg-white/30"></div>
        </div>

      </div>
    </div>
  );
}