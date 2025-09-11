import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { robustFetch } from '@/lib/error-handler';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import backgroundImage from '@assets/Clienti_20250820_014109_0000_1755646907560.png';

const formSchema = z.object({
  uniqueCode: z.string().min(1, "Codice obbligatorio"),
  fullName: z.string().min(1, "Nome e cognome obbligatori"),
  phoneNumber: z.string().min(1, "Numero di telefono obbligatorio")
});

type FormValues = z.infer<typeof formSchema>;

export default function WelcomeNew() {
  const [, setLocation] = useLocation();
  const [rememberData, setRememberData] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // DESIGN PERSONALIZZABILE - Valori ottimali per mobile
  const [logoTopPosition, setLogoTopPosition] = useState(2);
  const [formBottomPosition, setFormBottomPosition] = useState(1);
  const [logoSize, setLogoSize] = useState(4); // Più piccolo per mobile
  const [logoColor, setLogoColor] = useState('#EC4899');
  const [formSize, setFormSize] = useState(0.9);

  // Carica design scelto dall'utente
  useEffect(() => {
    const selectedDesign = localStorage.getItem('selectedDesign');
    if (selectedDesign) {
      const design = JSON.parse(selectedDesign);
      setLogoTopPosition(design.logoTop);
      setFormBottomPosition(design.formBottom);
      setLogoSize(design.logoSize);
      setLogoColor(design.logoColor);
      setFormSize(design.formSize);
    }
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      uniqueCode: "",
      fullName: "",
      phoneNumber: ""
    }
  });

  // Carica i dati salvati al caricamento della pagina
  useEffect(() => {
    const savedData = localStorage.getItem('rememberedData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        form.setValue('uniqueCode', data.uniqueCode || '');
        form.setValue('fullName', data.fullName || '');
        form.setValue('phoneNumber', data.phoneNumber || '');
        setRememberData(true);
      } catch (error) {
        console.error('Errore nel caricamento dati salvati:', error);
      }
    }

  }, [form]);


  // Funzione per controllare se è modalità admin - TRASFORMA IL CAMPO
  const handleCodeChange = (value: string) => {
    // Quando scrivi "admin" il campo diventa password automaticamente
    if (value && value.trim().toLowerCase() === 'admin') {
      setIsAdminMode(true);
      // Sostituisce "admin" con la password che l'utente dovrà inserire
      setTimeout(() => {
        form.setValue("uniqueCode", "");
      }, 100);
    } else {
      setIsAdminMode(false);
      setAdminPassword("");
    }
  };


  const accessMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      setIsLoading(true);
      setErrorMessage(''); // Reset errori precedenti
      
      try {
        // 🛡️ ACCESSO CON RETRY AUTOMATICO
        const response = await robustFetch('/api/access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }, {
          maxRetries: 2,
          retryDelay: 800,
          showToast: false
        });
        
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('🚨 Errore accesso:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.success) {
        setShowSuccess(true);
        setTimeout(() => {
          setLocation('/dashboard');
        }, 1500);
      } else {
        setErrorMessage(data.message || 'Errore durante l\'accesso');
      }
      setIsLoading(false);
    },
    onError: (error: any) => {
      setIsLoading(false);
      
      if (error.message && error.message.includes('server: 403')) {
        setErrorMessage('Il tuo accesso è stato disattivato. Contatta il salone.');
      } else if (error.message && error.message.includes('server:')) {
        setErrorMessage('Problema di connessione. Riprova tra poco.');
      } else {
        setErrorMessage('Verifica i dati inseriti e riprova.');
      }
    }
  });

  const adminMutation = useMutation({
    mutationFn: async () => {
      setIsLoading(true);
      setErrorMessage(''); // Reset errori precedenti
      
      try {
        const response = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminCode: "admin",
            password: form.getValues("uniqueCode")
          })
        });
        
        if (!response.ok) {
          throw new Error(`Errore server: ${response.status}`);
        }
        
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Errore login admin:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.success) {
        localStorage.setItem('adminAuth', 'true');
        localStorage.setItem('adminAuthTime', Date.now().toString());
        setShowSuccess(true);
        setTimeout(() => {
          setLocation('/admin');
        }, 1500);
      } else {
        setErrorMessage(data.message || 'Password admin errata');
      }
      setIsLoading(false);
    },
    onError: (error: any) => {
      setIsLoading(false);
      
      if (error.message && error.message.includes('server:')) {
        setErrorMessage('Problema di connessione. Riprova tra poco.');
      } else {
        setErrorMessage('Password admin errata. Riprova.');
      }
    }
  });

  const onSubmit = (data: FormValues) => {
    if (isAdminMode) {
      // Modalità admin: usa la password dal campo principale
      adminMutation.mutate();
    } else {
      // Modalità cliente normale
      if (rememberData) {
        localStorage.setItem('rememberedData', JSON.stringify(data));
      }
      accessMutation.mutate(data);
    }
  };

  return (
    <div className="h-screen relative overflow-hidden welcome-page"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >


    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="h-full flex items-center justify-center"
    >
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>

      {/* Form spostato ancora più in basso - RIDOTTO ULTERIORMENTE */}
      <div className="relative z-10 px-6 w-full flex justify-center" style={{ marginTop: '200px' }}>
        <div 
          className="w-full max-w-md mx-auto transition-all duration-300"
          style={{ transform: `scale(${formSize})` }}
        >
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            
            <Form {...form}>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  
                  if (isAdminMode) {
                    // Admin mode: bypass validation and call onSubmit directly
                    onSubmit({ 
                      uniqueCode: form.getValues("uniqueCode"), 
                      fullName: "", 
                      phoneNumber: "" 
                    });
                  } else {
                    // Normal mode: use form validation
                    form.handleSubmit(onSubmit)(e);
                  }
                }}
                className="space-y-2"
              >
                
                <FormField
                  control={form.control}
                  name="uniqueCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileFocus={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <div className="relative">
                            <Input
                              {...field}
                              type={isAdminMode ? (showPassword ? "text" : "password") : "text"}
                              placeholder={isAdminMode ? "🔐 Password Admin" : "Il tuo codice personale"}
                              className={`glass-input transition-all duration-300 hover:shadow-lg focus:shadow-xl ${isAdminMode ? 'pr-20' : ''}`}
                              disabled={accessMutation.isPending}
                              onChange={(e) => {
                                field.onChange(e);
                                if (!isAdminMode) {
                                  handleCodeChange(e.target.value);
                                } else {
                                  setAdminPassword(e.target.value);
                                }
                              }}
                              style={{
                                borderColor: isAdminMode && field.value ? 
                                  (field.value === 'frannie2024' ? '#10b981' : 
                                   field.value.length > 8 ? '#ef4444' : 'rgba(191, 140, 152, 0.8)') : 
                                  'rgba(191, 140, 152, 0.8)'
                              }}
                            />
                            
                            {/* Indicatori e controlli per admin */}
                            {isAdminMode && (
                              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                                {/* Indicatore password corretta/sbagliata */}
                                {field.value && field.value.length > 3 && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    {field.value === 'frannie2024' ? (
                                      <span className="text-green-500 text-lg">✅</span>
                                    ) : field.value.length > 8 ? (
                                      <span className="text-red-500 text-lg">❌</span>
                                    ) : (
                                      <span className="text-yellow-500 text-lg">⏳</span>
                                    )}
                                  </motion.div>
                                )}
                                
                                {/* Pulsante mostra/nascondi password */}
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                                >
                                  <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    transition={{ duration: 0.1 }}
                                  >
                                    {showPassword ? '👁️' : '🔒'}
                                  </motion.div>
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isAdminMode && (
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileFocus={{ scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <Input
                              {...field}
                              placeholder="Nome e Cognome"
                              className="glass-input transition-all duration-300 hover:shadow-lg focus:shadow-xl"
                              disabled={accessMutation.isPending}
                            />
                          </motion.div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {!isAdminMode && (
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileFocus={{ scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <Input
                              {...field}
                              type="tel"
                              placeholder="Numero di Telefono"
                              className="glass-input transition-all duration-300 hover:shadow-lg focus:shadow-xl"
                              disabled={accessMutation.isPending}
                            />
                          </motion.div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Messaggio per modalità admin con status password - COMPATTO */}
                {isAdminMode && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-center p-1.5 rounded-lg -mt-2 -mb-1"
                    style={{ 
                      backgroundColor: form.watch("uniqueCode") === 'frannie2024' ? 
                        'rgba(16, 185, 129, 0.1)' : 'rgba(170, 99, 109, 0.1)'
                    }}
                  >
                    <div className="text-xs font-medium" 
                         style={{ 
                           color: form.watch("uniqueCode") === 'frannie2024' ? 
                             '#059669' : '#AA636D' 
                         }}>
                      {form.watch("uniqueCode") === 'frannie2024' ? (
                        '✅ Password corretta!'
                      ) : (
                        '🔐 Modalità Admin'
                      )}
                    </div>
                  </motion.div>
                )}

                {!isAdminMode && (
                  <div className="flex items-center justify-center space-x-3">
                    <Checkbox
                      id="remember"
                      checked={rememberData}
                      onCheckedChange={(checked) => setRememberData(checked as boolean)}
                      className="data-[state=checked]:bg-[#AA636D] data-[state=checked]:border-[#AA636D]"
                      style={{ borderColor: '#BF8C98' }}
                    />
                    <Label htmlFor="remember" className="cursor-pointer" style={{ color: '#AA636D' }}>
                      Ricorda i miei dati
                    </Label>
                  </div>
                )}

                {/* Messaggio di errore */}
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-center p-3 rounded-lg bg-red-50/80 backdrop-blur-sm border border-red-200"
                  >
                    <div className="text-sm font-medium text-red-600 flex items-center justify-center gap-2">
                      <span>⚠️</span>
                      {errorMessage}
                    </div>
                  </motion.div>
                )}

                <motion.div
                  whileHover={{ scale: showSuccess ? 1 : 1.05 }}
                  whileTap={{ scale: showSuccess ? 1 : 0.95 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  animate={{
                    scale: showSuccess ? [1, 1.1, 1] : 1,
                    rotate: showSuccess ? [0, 5, -5, 0] : 0
                  }}
                >
                  <Button 
                    type="submit"
                    className={`glass-button w-full transition-all duration-500 hover:shadow-xl relative overflow-hidden ${showSuccess ? 'bg-green-500' : ''}`}
                    disabled={isLoading || showSuccess}
                    style={{
                      background: showSuccess 
                        ? 'linear-gradient(135deg, #10b981, #059669)' 
                        : isLoading
                        ? 'linear-gradient(135deg, rgba(170, 99, 109, 0.7), rgba(191, 140, 152, 0.7))'
                        : undefined
                    }}
                  >
                    {showSuccess ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2"
                      >
                        <span>✅</span> Accesso riuscito!
                      </motion.div>
                    ) : isLoading ? (
                      <motion.div
                        className="flex items-center gap-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          🔄
                        </motion.div>
                        Accesso in corso...
                      </motion.div>
                    ) : (
                      <motion.div
                        whileHover={{ x: [0, 5, 0] }}
                        transition={{ duration: 0.3 }}
                      >
                        {isAdminMode ? "🔐 Accedi come Admin" : "✨ Accedi"}
                      </motion.div>
                    )}
                    
                    {/* Effetto sparkle sui lati */}
                    {isLoading && (
                      <>
                        <motion.div
                          className="absolute left-2 top-1/2 transform -translate-y-1/2"
                          animate={{ 
                            opacity: [0, 1, 0],
                            scale: [0.5, 1, 0.5],
                            rotate: [0, 180, 360]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          ✨
                        </motion.div>
                        <motion.div
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                          animate={{ 
                            opacity: [0, 1, 0],
                            scale: [0.5, 1, 0.5],
                            rotate: [0, -180, -360]
                          }}
                          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                        >
                          ✨
                        </motion.div>
                      </>
                    )}
                  </Button>
                </motion.div>

              </form>
            </Form>

          </motion.div>
        </div>
      </div>
    </motion.div>
    </div>
  );
}