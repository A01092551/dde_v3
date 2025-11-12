// Configuración de URLs del API
// Cambia entre el backend local de Next.js o el backend FastAPI

export const API_CONFIG = {
  // Backend FastAPI (Python)
  BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
  
  // Endpoints
  ENDPOINTS: {
    // Auth
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    
    // Invoices
    EXTRACT_INVOICE: '/api/invoices/extract',
    VALIDATE_INVOICE: '/api/invoices/validate',
    LIST_INVOICES: '/api/invoices',
    GET_INVOICE: (id: string) => `/api/invoices/${id}`,
    DELETE_INVOICE: (id: string) => `/api/invoices/${id}`,
  }
};

// Helper para construir URL completa
export function getApiUrl(endpoint: string): string {
  return `${API_CONFIG.BACKEND_URL}${endpoint}`;
}
