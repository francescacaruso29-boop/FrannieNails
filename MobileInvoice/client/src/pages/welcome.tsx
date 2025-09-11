import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import backgroundImage from "@assets/top-view-nails-care-elements-arrangement-with-copy-space-1_1756074622997.jpg";
import logoImage from "@assets/logo_1756075654836.png";

export default function Welcome() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    uniqueCode: '',
    fullName: '',
    phoneNumber: ''
  });
  const [rememberData, setRememberData] = useState(false);

  // Carica i dati salvati al caricamento della pagina
  useEffect(() => {
    const savedData = localStorage.getItem('rememberedData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setFormData({
          uniqueCode: data.uniqueCode || '',
          fullName: data.fullName || '',
          phoneNumber: data.phoneNumber || ''
        });
        setRememberData(true);
      } catch (error) {
        console.error('Errore nel caricamento dati salvati:', error);
      }
    }
  }, []);

  const handleSubmit = async () => {
    if (rememberData) {
      localStorage.setItem('rememberedData', JSON.stringify(formData));
    }

    // Logica di accesso (simile a welcome-new.tsx)
    try {
      const response = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      
      if (data.success) {
        setLocation('/dashboard');
      }
    } catch (error) {
      console.error('Errore durante l\'accesso:', error);
    }
  };

  return (
    <div 
      style={{
        height: '100vh',
        width: '100vw',
        margin: 0,
        padding: 0,
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      <img 
        src={logoImage} 
        alt="Frannie NAILS" 
        style={{
          position: 'fixed',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '400px',
          height: 'auto',
          zIndex: 1
        }}
      />
      
      <div 
        style={{
          position: 'fixed',
          top: '65%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '320px',
          textAlign: 'center',
          zIndex: 2
        }}
      >
        <input 
          type="text" 
          placeholder="Codice" 
          value={formData.uniqueCode}
          onChange={(e) => setFormData({...formData, uniqueCode: e.target.value})}
          style={{
            width: '100%',
            padding: '9px 20px',
            margin: '5px 0',
            border: '1px solid #ddd',
            borderRadius: '15px',
            fontSize: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            color: '#666',
            outline: 'none'
          }}
        />
        <input 
          type="text" 
          placeholder="Nome e Cognome" 
          value={formData.fullName}
          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
          style={{
            width: '100%',
            padding: '9px 20px',
            margin: '5px 0',
            border: '1px solid #ddd',
            borderRadius: '15px',
            fontSize: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            color: '#666',
            outline: 'none'
          }}
        />
        <input 
          type="tel" 
          placeholder="Numero di Telefono" 
          value={formData.phoneNumber}
          onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
          style={{
            width: '100%',
            padding: '9px 20px',
            margin: '5px 0',
            border: '1px solid #ddd',
            borderRadius: '15px',
            fontSize: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            color: '#666',
            outline: 'none'
          }}
        />
        
        <div style={{ margin: '10px 0', textAlign: 'center' }}>
          <label 
            style={{ 
              fontSize: '14px', 
              color: '#666', 
              fontWeight: 'normal', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => setRememberData(!rememberData)}
          >
            <div 
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                marginRight: '8px',
                backgroundColor: rememberData ? '#cd7f7f' : 'white',
                border: '2px solid #cd7f7f',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: rememberData ? 'scale(1.1)' : 'scale(1)'
              }}
            />
            Ricorda i miei dati
          </label>
        </div>
        
        <button 
          onClick={handleSubmit}
          style={{
            width: '100%',
            padding: '9px 20px',
            margin: '8px 0',
            backgroundColor: '#cd7f7f',
            color: 'white',
            border: 'none',
            borderRadius: '15px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Accedi
        </button>
      </div>
    </div>
  );
}
