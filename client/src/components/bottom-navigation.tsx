import { Calendar, Home, MessageCircle, User, Image } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

export function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);

  const navItems = [
    { 
      path: "/services", 
      icon: Home, 
      label: "Servizi", 
      active: location === "/services" 
    },
    { 
      path: "/calendar", 
      icon: Calendar, 
      label: "Calendario", 
      active: location === "/calendar" 
    },
    { 
      path: "/dashboard", 
      icon: Image, 
      label: "Galleria", 
      active: location === "/dashboard" 
    },
    { 
      path: "/profile", 
      icon: User, 
      label: "Profilo", 
      active: location === "/profile" 
    }
  ];

  // Update active index when location changes
  useEffect(() => {
    const currentIndex = navItems.findIndex(item => item.active);
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex);
    }
  }, [location]);

  const handleNavClick = (path: string, index: number) => {
    setActiveIndex(index);
    setLocation(path);
  };



  return (
      <div className="fixed bottom-0 left-0 right-0 pb-safe z-50">
        <div className="relative flex items-center justify-center px-6 py-4 max-w-md mx-auto">
          
          {/* Main Navigation Bar */}
          <div className="flex items-center justify-between w-full bg-white/80 rounded-full px-6 py-3 relative backdrop-blur-sm border border-pink-200/30">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = index === activeIndex;
              
              return (
                <div key={item.path} className="relative">
                  <button
                    onClick={() => handleNavClick(item.path, index)}
                    className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                      isActive 
                        ? 'hover:bg-pink-100' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-pink-50'
                    }`}
                    style={isActive ? { color: '#d38a77' } : {}}
                  >
                    <Icon className="w-6 h-6" />
                  </button>
                  
                  {/* Pink Line Indicator */}
                  {isActive && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full" style={{ backgroundColor: '#d38a77' }} />
                  )}
                </div>
              );
            })}
          </div>
          

        </div>
      </div>
  );
}