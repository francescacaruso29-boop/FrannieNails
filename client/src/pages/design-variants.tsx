import React from 'react';
import { useLocation } from 'wouter';

export default function DesignVariants() {
  const [, setLocation] = useLocation();
  
  const backgroundImage = "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80";

  const variants = [
    {
      id: 1,
      name: "ELEGANTE - Logo alto, Form basso",
      logoTop: 1,
      formBottom: 0.5,
      logoSize: 8,
      logoColor: '#D946EF',
      formSize: 0.9,
      description: "Stile elegante con tanto spazio"
    },
    {
      id: 2, 
      name: "BILANCIATO - Centrato",
      logoTop: 4,
      formBottom: 1.5,
      logoSize: 7,
      logoColor: '#EC4899',
      formSize: 1,
      description: "Equilibrato, perfetto per mobile"
    },
    {
      id: 3,
      name: "COMPATTO - Elementi vicini", 
      logoTop: 6,
      formBottom: 2.5,
      logoSize: 6,
      logoColor: '#BE185D',
      formSize: 1.1,
      description: "Tutto più vicino e accessibile"
    }
  ];

  const selectVariant = (variant: any) => {
    // Salva la scelta
    localStorage.setItem('selectedDesign', JSON.stringify(variant));
    alert(`✅ Hai scelto: ${variant.name}\nTorno alla pagina principale!`);
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">🎨 SCEGLI IL TUO DESIGN</h1>
        <p className="text-center text-gray-600 mb-8">Clicca sulla versione che ti piace di più</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {variants.map((variant) => (
            <div key={variant.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Preview */}
              <div 
                className="h-96 relative cursor-pointer transform hover:scale-105 transition-all duration-300"
                style={{
                  backgroundImage: `url(${backgroundImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
                onClick={() => selectVariant(variant)}
              >
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                
                {/* Logo Preview */}
                <div className="relative z-10 px-4" style={{ paddingTop: `${variant.logoTop}rem` }}>
                  <div className="text-center">
                    <h1 
                      style={{
                        fontSize: `${variant.logoSize * 0.8}rem`,
                        color: variant.logoColor,
                        fontFamily: '"Playfair Display", serif',
                        fontWeight: '700',
                        textShadow: '0 4px 8px rgba(0,0,0,0.6)',
                        letterSpacing: '0.02em'
                      }}
                    >
                      Benvenuta
                    </h1>
                  </div>
                </div>

                {/* Form Preview */}
                <div 
                  className="absolute bottom-0 left-0 right-0 px-4" 
                  style={{ paddingBottom: `${variant.formBottom}cm` }}
                >
                  <div 
                    className="w-full max-w-sm mx-auto bg-white/90 p-3 rounded-lg"
                    style={{ transform: `scale(${variant.formSize * 0.8})` }}
                  >
                    <div className="space-y-2">
                      <input className="w-full p-2 rounded border text-sm" placeholder="Codice" disabled />
                      <input className="w-full p-2 rounded border text-sm" placeholder="Nome e Cognome" disabled />
                      <input className="w-full p-2 rounded border text-sm" placeholder="Telefono" disabled />
                      <button 
                        className="w-full p-2 text-white rounded text-sm font-bold"
                        style={{ backgroundColor: variant.logoColor }}
                      >
                        Accedi
                      </button>
                    </div>
                  </div>
                </div>

                {/* Click overlay */}
                <div className="absolute inset-0 bg-pink-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="bg-white/90 px-6 py-3 rounded-lg font-bold text-pink-600">
                    👆 CLICCA PER SCEGLIERE
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{variant.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{variant.description}</p>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
                  <div>Logo: {variant.logoTop}rem alto</div>
                  <div>Form: {variant.formBottom}cm basso</div>
                  <div>Dimensione: {variant.logoSize}rem</div>
                  <div>Scala: {variant.formSize}x</div>
                </div>

                <button 
                  onClick={() => selectVariant(variant)}
                  className="w-full py-3 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105"
                  style={{ backgroundColor: variant.logoColor }}
                >
                  ✅ SCEGLI QUESTO
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Back button */}
        <div className="text-center mt-8">
          <button 
            onClick={() => setLocation('/')}
            className="bg-gray-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-600"
          >
            ← TORNA INDIETRO
          </button>
        </div>
      </div>
    </div>
  );
}