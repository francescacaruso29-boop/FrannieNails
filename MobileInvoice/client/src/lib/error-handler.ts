// Sistema di Error Handling Robusto - Frannie NAILS
// Gestisce errori di rete, retry automatico e recovery

interface ErrorHandlerOptions {
  maxRetries?: number;
  retryDelay?: number;
  showToast?: boolean;
  fallbackData?: any;
  onError?: (error: Error) => void;
}

interface NetworkError extends Error {
  status?: number;
  isNetworkError?: boolean;
  isRetryable?: boolean;
}

class ErrorHandler {
  private retryAttempts = new Map<string, number>();

  // 🔄 RETRY AUTOMATICO INTELLIGENTE
  async retryRequest<T>(
    requestFn: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      showToast = true,
      fallbackData,
      onError
    } = options;

    const requestId = this.generateRequestId();
    let lastError: NetworkError = new Error('Unknown error');

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Reset retry count on success
        this.retryAttempts.delete(requestId);
        return await requestFn();
        
      } catch (error) {
        lastError = this.classifyError(error);
        
        console.warn(`🔄 Tentativo ${attempt + 1}/${maxRetries + 1} fallito:`, lastError.message);
        
        // Se non è retriable o è l'ultimo tentativo, lancia errore
        if (!lastError.isRetryable || attempt === maxRetries) {
          break;
        }
        
        // Delay exponential backoff
        const delay = retryDelay * Math.pow(2, attempt);
        console.log(`⏰ Retry in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    // Gestisci fallimento finale
    this.retryAttempts.set(requestId, maxRetries + 1);
    
    if (onError) {
      onError(lastError);
    }

    if (showToast) {
      this.showErrorToast(lastError);
    }

    // Se c'è fallback data, usalo
    if (fallbackData !== undefined) {
      console.log('🔄 Usando dati fallback dopo errori');
      return fallbackData;
    }

    throw lastError;
  }

  // 🏷️ CLASSIFICA ERRORI
  private classifyError(error: any): NetworkError {
    const networkError: NetworkError = new Error(error.message || 'Errore sconosciuto');
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      networkError.isNetworkError = true;
      networkError.isRetryable = true;
      networkError.message = 'Connessione di rete persa';
    } else if (error.status) {
      networkError.status = error.status;
      networkError.isRetryable = this.isRetryableStatus(error.status);
      
      if (error.status >= 500) {
        networkError.message = 'Errore del server, riprovo...';
      } else if (error.status === 404) {
        networkError.message = 'Risorsa non trovata';
        networkError.isRetryable = false;
      } else if (error.status === 401) {
        networkError.message = 'Sessione scaduta, rieffettua il login';
        networkError.isRetryable = false;
      } else if (error.status === 403) {
        networkError.message = 'Accesso negato';
        networkError.isRetryable = false;
      }
    } else {
      networkError.isRetryable = true;
    }

    return networkError;
  }

  // 🎯 STATUS CODES RETRIABLE
  private isRetryableStatus(status: number): boolean {
    return [408, 429, 500, 502, 503, 504].includes(status);
  }

  // 🔔 MOSTRA TOAST ERROR
  private showErrorToast(error: NetworkError) {
    // Dinamicamente importa toast per evitare circular deps
    import('@/hooks/use-toast').then(({ toast }) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    });
  }

  // ⏰ SLEEP HELPER
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 🆔 GENERA ID RICHIESTA
  private generateRequestId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // 📊 STATISTICHE ERRORI
  getRetryStats(): { [requestId: string]: number } {
    return Object.fromEntries(this.retryAttempts);
  }

  // 🧹 PULISCI STATISTICHE
  clearRetryStats() {
    this.retryAttempts.clear();
  }
}

// 🌐 WRAPPER PER FETCH CON RETRY
export async function robustFetch(
  url: string, 
  options: RequestInit = {},
  errorOptions: ErrorHandlerOptions = {}
): Promise<Response> {
  const errorHandler = new ErrorHandler();
  
  return errorHandler.retryRequest(
    async () => {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as NetworkError;
        error.status = response.status;
        throw error;
      }
      
      return response;
    },
    errorOptions
  );
}

// 🛡️ WRAPPER PER API REQUESTS
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  options: ErrorHandlerOptions = {}
): Promise<T | null> {
  const errorHandler = new ErrorHandler();
  
  try {
    return await errorHandler.retryRequest(apiCall, {
      maxRetries: 2,
      retryDelay: 500,
      showToast: true,
      ...options
    });
  } catch (error) {
    console.error('🚨 API call failed definitivamente:', error);
    return null;
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler();
export default ErrorHandler;