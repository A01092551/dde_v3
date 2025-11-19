'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getApiUrl, API_CONFIG } from '@/lib/api-config';

interface FacturaData {
  numeroFactura?: string;
  fecha?: string;
  proveedor?: string;
  cliente?: string;
  subtotal?: number;
  iva?: number;
  total?: number;
  items?: Array<{
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    total: number;
  }>;
  [key: string]: any;
}

interface InvoiceItem {
  file: File;
  previewUrl: string;
  extractedData: FacturaData | null;
  isProcessed: boolean;
  isValidated: boolean;
  error?: string;
}

export default function ExtraccionPage() {
  // Estados para múltiples facturas
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<FacturaData | null>(null);
  const router = useRouter();

  // Factura actual
  const currentInvoice = invoices[currentIndex] || null;

  useEffect(() => {
    // Verificar autenticación
    const isAuth = localStorage.getItem('isAuthenticated');
    if (!isAuth) {
      router.push('/login');
    }
  }, [router]);

  // Cleanup: Revoke object URLs when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup se ejecuta solo al desmontar el componente
      // Accedemos a invoices a través de un ref para evitar dependencias
    };
  }, []);

  // Cleanup manual cuando se elimina una factura (ya está en handleRemoveInvoice)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const newInvoices: InvoiceItem[] = [];
    const errors: string[] = [];
    const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];

    files.forEach(file => {
      // Validar nombre de archivo
      if (!file.name || file.name.trim() === '') {
        errors.push('Archivo sin nombre detectado');
        return;
      }

      // Validar tamaño de archivo
      if (file.size === 0) {
        errors.push(`${file.name}: Archivo vacío`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: Archivo demasiado grande (${(file.size / 1024 / 1024).toFixed(2)}MB). Máximo permitido: 1MB`);
        return;
      }

      // Validar tipo de archivo
      if (!validTypes.includes(file.type)) {
        errors.push(`${file.name}: Tipo de archivo no permitido (${file.type})`);
        return;
      }

      // Validar extensión de archivo
      const extension = '.' + file.name.toLowerCase().split('.').pop();
      if (!validExtensions.includes(extension)) {
        errors.push(`${file.name}: Extensión no permitida (${extension})`);
        return;
      }

      // Archivo válido
      newInvoices.push({
        file,
        previewUrl: URL.createObjectURL(file),
        extractedData: null,
        isProcessed: false,
        isValidated: false,
      });
    });

    // Mostrar resultados
    if (newInvoices.length > 0) {
      setInvoices(prev => [...prev, ...newInvoices]);
      setError('');
      setSuccessMessage(`${newInvoices.length} factura(s) cargada(s)`);
      setTimeout(() => setSuccessMessage(''), 3000);
    }

    if (errors.length > 0) {
      setError(`❌ Errores de validación:\n${errors.join('\n')}`);
    } else if (newInvoices.length === 0) {
      setError('Por favor, sube archivos PDF o imágenes válidas (PNG, JPG, WEBP)');
    } else {
      setError('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (invoices.length === 0) {
      setError('Por favor, carga al menos una factura');
      return;
    }

    setLoading(true);
    setError('');

    // Procesar todas las facturas pendientes en secuencia
    let processedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < invoices.length; i++) {
      const invoice = invoices[i];
      
      // Saltar facturas ya procesadas
      if (invoice.isProcessed) {
        continue;
      }

      try {
        // Actualizar el índice actual para mostrar qué factura se está procesando
        setCurrentIndex(i);
        setSuccessMessage(`🔄 Procesando factura ${i + 1}/${invoices.length}: ${invoice.file.name}...`);

        const formData = new FormData();
        formData.append('file', invoice.file);

        const apiUrl = getApiUrl(API_CONFIG.ENDPOINTS.EXTRACT_INVOICE);
        const response = await fetch(apiUrl, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || errorData.detail || 'Error al procesar la factura';
          throw new Error(errorMessage);
        }

        const data = await response.json();
        
        // Actualizar la factura con los datos extraídos
        setInvoices(prev => prev.map((inv, idx) => 
          idx === i 
            ? { ...inv, extractedData: data, isProcessed: true }
            : inv
        ));
        
        processedCount++;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al procesar el archivo';
        
        // Marcar error en la factura
        setInvoices(prev => prev.map((inv, idx) => 
          idx === i 
            ? { ...inv, error: errorMsg }
            : inv
        ));
        
        errorCount++;
      }
    }

    setLoading(false);
    
    // Mensaje final
    if (errorCount === 0) {
      setSuccessMessage(`✅ ${processedCount} factura(s) procesada(s) exitosamente`);
    } else {
      setSuccessMessage(`⚠️ ${processedCount} procesada(s), ${errorCount} con errores`);
    }
    
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    router.push('/login');
  };

  const handleReset = () => {
    // Limpiar URLs de todas las facturas
    invoices.forEach(invoice => {
      if (invoice.previewUrl) {
        URL.revokeObjectURL(invoice.previewUrl);
      }
    });
    
    setInvoices([]);
    setCurrentIndex(0);
    setError('');
    setSuccessMessage('');
    setIsEditing(false);
    setEditedData(null);
  };

  const handleRemoveInvoice = (index: number) => {
    const invoice = invoices[index];
    if (invoice.previewUrl) {
      URL.revokeObjectURL(invoice.previewUrl);
    }
    
    const newInvoices = invoices.filter((_, idx) => idx !== index);
    setInvoices(newInvoices);
    
    // Ajustar el índice actual si es necesario
    if (currentIndex >= newInvoices.length && newInvoices.length > 0) {
      setCurrentIndex(newInvoices.length - 1);
    } else if (newInvoices.length === 0) {
      setCurrentIndex(0);
    }
  };

  const handleNextInvoice = () => {
    if (currentIndex < invoices.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsEditing(false);
      setEditedData(null);
      setError('');
      setSuccessMessage('');
    }
  };

  const handlePrevInvoice = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsEditing(false);
      setEditedData(null);
      setError('');
      setSuccessMessage('');
    }
  };

  const handleValidate = async () => {
    if (!currentInvoice || !currentInvoice.extractedData) {
      setError('No hay datos para validar');
      return;
    }

    if (currentInvoice.isValidated) {
      setError('Esta factura ya ha sido validada');
      return;
    }

    setValidating(true);
    setError('');
    setSuccessMessage('');

    try {
      // Obtener email del usuario del localStorage
      const userEmail = localStorage.getItem('userEmail') || 'unknown';
      
      // Determinar si la factura fue modificada
      const wasModified = isEditing || editedData !== null;
      
      // Usar datos editados si existen, sino usar los extraídos
      const dataToSend = editedData || currentInvoice.extractedData;
      
      // Crear FormData para enviar archivo + datos
      const formData = new FormData();
      formData.append('file', currentInvoice.file);
      formData.append('invoice_data', JSON.stringify(dataToSend));
      formData.append('validatedBy', userEmail);
      formData.append('wasModified', wasModified.toString());
      
      const apiUrl = getApiUrl(API_CONFIG.ENDPOINTS.VALIDATE_INVOICE);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData, // No incluir Content-Type header, el navegador lo establece automáticamente con boundary
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('Esta factura ya ha sido validada anteriormente');
        }
        // Mostrar mensaje de error más descriptivo
        const errorMsg = data.detail || data.error || 'Error al validar la factura';
        throw new Error(errorMsg);
      }
      
      // Marcar como validada
      setInvoices(prev => prev.map((inv, idx) => 
        idx === currentIndex 
          ? { ...inv, isValidated: true }
          : inv
      ));
      
      // Limpiar estado de edición
      setIsEditing(false);
      setEditedData(null);
      
      setSuccessMessage(`✅ Factura validada y guardada exitosamente (ID: ${data.id})`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al validar la factura');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image
              className="dark:invert"
              src="/next.svg"
              alt="Logo"
              width={100}
              height={20}
            />
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
              Extracción de Facturas
            </h1>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
            >
              ← Menú Principal
            </button>
            <button
              onClick={() => router.push('/facturas')}
              className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ver Facturas Guardadas
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Sección 1: Cargar Facturas */}
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">
              📂 Cargar Facturas
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Columna Izquierda: Botón y Zona de Arrastre */}
              <div>
                <form onSubmit={handleSubmit}>
                  {/* Drag & Drop Area */}
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl p-6 transition-colors ${
                      dragActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500'
                    }`}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-6 transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500'
                }`}
              >
                <input
                  type="file"
                  id="file-upload"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <div className="flex items-center justify-between">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium whitespace-nowrap">
                      📂 Seleccionar Facturas
                    </span>
                  </label>
                  <div className="flex items-center gap-4">
                    <svg
                      className="w-12 h-12 text-zinc-400 dark:text-zinc-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <div>
                      <p className="text-base font-medium text-zinc-700 dark:text-zinc-300">
                        Arrastra tus facturas aquí
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Múltiples archivos: PDF o imágenes
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              </form>
            </div>

            {/* Columna Derecha: Lista de Facturas */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                📋 Facturas Cargadas ({invoices.length})
              </h3>
              
              {invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center bg-zinc-50 dark:bg-zinc-900 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600">
                  <svg className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-zinc-500 dark:text-zinc-400">
                    No hay facturas cargadas
                  </p>
                  <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-2">
                    Selecciona o arrastra archivos para comenzar
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {invoices.map((invoice, index) => (
                    <div 
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 transition cursor-pointer ${
                        index === currentIndex 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                      }`}
                      onClick={() => {
                        setCurrentIndex(index);
                        setSuccessMessage('');
                        setError('');
                        setIsEditing(false);
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {invoice.isValidated ? (
                          <span className="text-green-500 text-xl">✅</span>
                        ) : invoice.isProcessed ? (
                          <span className="text-blue-500 text-xl">📊</span>
                        ) : invoice.error ? (
                          <span className="text-red-500 text-xl">❌</span>
                        ) : (
                          <span className="text-zinc-400 text-xl">📄</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
                            {invoice.file.name}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {(invoice.file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveInvoice(index);
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sección 2: Vista Previa y Datos Extraídos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna Izquierda: Vista Previa */}
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">
              👁️ Vista Previa
            </h2>

            {/* Preview Section - Fixed Height */}
            <div className="h-[600px] bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
              {!currentInvoice ? (
                <div className="flex flex-col items-center justify-center h-full text-center bg-white dark:bg-zinc-800 rounded border-2 border-zinc-200 dark:border-zinc-700">
                  <svg
                    className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <p className="text-zinc-500 dark:text-zinc-400">
                    Carga facturas para ver la vista previa
                  </p>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <div className="flex-1 bg-white dark:bg-zinc-800 rounded border-2 border-zinc-200 dark:border-zinc-700 overflow-hidden">
                    {currentInvoice.file.type === 'application/pdf' ? (
                      <iframe
                        src={currentInvoice.previewUrl}
                        className="w-full h-full"
                        title="PDF Preview"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 p-4">
                        <img
                          src={currentInvoice.previewUrl}
                          alt="Invoice preview"
                          className="max-w-full max-h-full object-contain rounded"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-4">
                      <span>📄 {currentInvoice.file.name}</span>
                      <span>📏 {(currentInvoice.file.size / 1024).toFixed(2)} KB</span>
                      <span>🔖 {currentInvoice.file.type.split('/')[1].toUpperCase()}</span>
                    </div>
                    
                    {/* Navegación entre facturas */}
                    {invoices.length > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handlePrevInvoice}
                          disabled={currentIndex === 0}
                          className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-300 dark:hover:bg-zinc-600"
                        >
                          ←
                        </button>
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          {currentIndex + 1} / {invoices.length}
                        </span>
                        <button
                          type="button"
                          onClick={handleNextInvoice}
                          disabled={currentIndex === invoices.length - 1}
                          className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-300 dark:hover:bg-zinc-600"
                        >
                          →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Extract Button - Always Visible */}
            <div className="mt-6">
              <button
                onClick={handleSubmit}
                disabled={invoices.length === 0 || loading || invoices.every(inv => inv.isProcessed)}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </>
                ) : invoices.every(inv => inv.isProcessed) && invoices.length > 0 ? (
                  '✅ Todas Procesadas'
                ) : (
                  `🔍 Extraer Datos (${invoices.filter(inv => !inv.isProcessed).length} pendiente${invoices.filter(inv => !inv.isProcessed).length !== 1 ? 's' : ''})`
                )}
              </button>
            </div>
          </div>

          {/* Column 2: Extracted Data Section */}
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
              📊 Datos Extraídos
            </h2>

            {!currentInvoice?.extractedData && !loading && (
              <div className="flex flex-col items-center justify-center h-96 text-center">
                <svg
                  className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-zinc-500 dark:text-zinc-400">
                  Los datos extraídos aparecerán aquí
                </p>
              </div>
            )}

            {loading && !currentInvoice?.extractedData && (
              <div className="flex flex-col items-center justify-center h-96">
                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-lg p-6">
                  <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-blue-600 dark:text-blue-400 font-semibold text-center">
                    🤖 Analizando factura con OpenAI...
                  </p>
                  <p className="text-blue-500 dark:text-blue-500 text-xs text-center mt-2">
                    Esto puede tomar unos segundos
                  </p>
                </div>
              </div>
            )}

            {/* Error Display */}
            {currentInvoice?.error && !loading && (
              <div className="flex flex-col items-center justify-center h-96">
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-6 max-w-md">
                  <svg className="w-16 h-16 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-600 dark:text-red-400 font-semibold text-center mb-2">
                    ❌ Error al procesar la factura
                  </p>
                  <p className="text-red-500 dark:text-red-400 text-sm text-center">
                    {currentInvoice.error}
                  </p>
                  <button
                    onClick={() => {
                      // Limpiar el error y permitir reintentar
                      setInvoices(prev => prev.map((inv, idx) => 
                        idx === currentIndex ? { ...inv, error: undefined } : inv
                      ));
                    }}
                    className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors mx-auto block"
                  >
                    Limpiar Error
                  </button>
                </div>
              </div>
            )}

            {/* Extracted Data */}
            {currentInvoice?.extractedData && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-zinc-800 rounded-lg border-2 border-zinc-200 dark:border-zinc-700 max-h-[600px] overflow-y-auto">
                  <div className="p-6 space-y-6">
                    {/* Header con número y total */}
                    <div className="bg-blue-600 -mx-6 -mt-6 px-6 py-4 mb-6">
                      <div className="flex items-center justify-between text-white">
                        <h3 className="text-2xl font-bold">{currentInvoice.extractedData.numeroFactura || 'Sin número'}</h3>
                        <div className="text-right">
                          <p className="text-sm opacity-90">{currentInvoice.extractedData.fecha || 'Sin fecha'}</p>
                          <p className="text-2xl font-bold">{currentInvoice.extractedData.moneda || 'USD'} {currentInvoice.extractedData.total?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Datos de la Factura */}
                    <div>
                      <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Datos de la Factura
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Número de Factura</label>
                          <input 
                            type="text" 
                            value={isEditing ? (editedData?.numeroFactura || '') : (currentInvoice.extractedData.numeroFactura || '')} 
                            onChange={(e) => isEditing && setEditedData({...editedData!, numeroFactura: e.target.value})}
                            readOnly={!isEditing} 
                            className={`mt-1 w-full px-3 py-2 border rounded-lg text-zinc-900 dark:text-white ${isEditing ? 'bg-white dark:bg-zinc-800 border-blue-500' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600'}`} 
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Fecha</label>
                          <input 
                            type="text" 
                            value={isEditing ? (editedData?.fecha || '') : (currentInvoice.extractedData.fecha || '')} 
                            onChange={(e) => isEditing && setEditedData({...editedData!, fecha: e.target.value})}
                            readOnly={!isEditing} 
                            className={`mt-1 w-full px-3 py-2 border rounded-lg text-zinc-900 dark:text-white ${isEditing ? 'bg-white dark:bg-zinc-800 border-blue-500' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600'}`} 
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Fecha de Vencimiento</label>
                          <input 
                            type="text" 
                            value={isEditing ? (editedData?.fechaVencimiento || '') : (currentInvoice.extractedData.fechaVencimiento || '')} 
                            onChange={(e) => isEditing && setEditedData({...editedData!, fechaVencimiento: e.target.value})}
                            readOnly={!isEditing} 
                            className={`mt-1 w-full px-3 py-2 border rounded-lg text-zinc-900 dark:text-white ${isEditing ? 'bg-white dark:bg-zinc-800 border-blue-500' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600'}`} 
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Moneda</label>
                          <input 
                            type="text" 
                            value={isEditing ? (editedData?.moneda || '') : (currentInvoice.extractedData.moneda || '')} 
                            onChange={(e) => isEditing && setEditedData({...editedData!, moneda: e.target.value})}
                            readOnly={!isEditing} 
                            className={`mt-1 w-full px-3 py-2 border rounded-lg text-zinc-900 dark:text-white ${isEditing ? 'bg-white dark:bg-zinc-800 border-blue-500' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600'}`} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Proveedor */}
                    {(currentInvoice.extractedData.proveedor || isEditing) && (
                      <div>
                        <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Proveedor</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nombre</label>
                            <input 
                              type="text" 
                              value={isEditing ? (editedData?.proveedor?.nombre || '') : (currentInvoice.extractedData.proveedor?.nombre || '')} 
                              onChange={(e) => isEditing && setEditedData({...editedData!, proveedor: {...editedData?.proveedor, nombre: e.target.value}})}
                              readOnly={!isEditing}
                              className={`mt-1 w-full px-3 py-2 border rounded-lg text-zinc-900 dark:text-white ${isEditing ? 'bg-white dark:bg-zinc-800 border-blue-500' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600'}`}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">RFC/NIT</label>
                            <input 
                              type="text" 
                              value={isEditing ? (editedData?.proveedor?.rfc || editedData?.proveedor?.nit || '') : (currentInvoice.extractedData.proveedor?.rfc || currentInvoice.extractedData.proveedor?.nit || '')} 
                              onChange={(e) => isEditing && setEditedData({...editedData!, proveedor: {...editedData?.proveedor, rfc: e.target.value}})}
                              readOnly={!isEditing}
                              className={`mt-1 w-full px-3 py-2 border rounded-lg text-zinc-900 dark:text-white ${isEditing ? 'bg-white dark:bg-zinc-800 border-blue-500' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600'}`}
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Dirección</label>
                            <input 
                              type="text" 
                              value={isEditing ? (editedData?.proveedor?.direccion || '') : (currentInvoice.extractedData.proveedor?.direccion || '')} 
                              onChange={(e) => isEditing && setEditedData({...editedData!, proveedor: {...editedData?.proveedor, direccion: e.target.value}})}
                              readOnly={!isEditing}
                              className={`mt-1 w-full px-3 py-2 border rounded-lg text-zinc-900 dark:text-white ${isEditing ? 'bg-white dark:bg-zinc-800 border-blue-500' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600'}`}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Teléfono</label>
                            <input 
                              type="text" 
                              value={isEditing ? (editedData?.proveedor?.telefono || '') : (currentInvoice.extractedData.proveedor?.telefono || '')} 
                              onChange={(e) => isEditing && setEditedData({...editedData!, proveedor: {...editedData?.proveedor, telefono: e.target.value}})}
                              readOnly={!isEditing}
                              className={`mt-1 w-full px-3 py-2 border rounded-lg text-zinc-900 dark:text-white ${isEditing ? 'bg-white dark:bg-zinc-800 border-blue-500' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600'}`}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cliente */}
                    {(currentInvoice.extractedData.cliente || isEditing) && (
                      <div>
                        <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Cliente</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nombre</label>
                            <input 
                              type="text" 
                              value={isEditing ? (editedData?.cliente?.nombre || '') : (currentInvoice.extractedData.cliente?.nombre || '')} 
                              onChange={(e) => isEditing && setEditedData({...editedData!, cliente: {...editedData?.cliente, nombre: e.target.value}})}
                              readOnly={!isEditing}
                              className={`mt-1 w-full px-3 py-2 border rounded-lg text-zinc-900 dark:text-white ${isEditing ? 'bg-white dark:bg-zinc-800 border-blue-500' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600'}`}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">RFC/NIT</label>
                            <input 
                              type="text" 
                              value={isEditing ? (editedData?.cliente?.rfc || editedData?.cliente?.nit || '') : (currentInvoice.extractedData.cliente?.rfc || currentInvoice.extractedData.cliente?.nit || '')} 
                              onChange={(e) => isEditing && setEditedData({...editedData!, cliente: {...editedData?.cliente, rfc: e.target.value}})}
                              readOnly={!isEditing}
                              className={`mt-1 w-full px-3 py-2 border rounded-lg text-zinc-900 dark:text-white ${isEditing ? 'bg-white dark:bg-zinc-800 border-blue-500' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600'}`}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Items */}
                    {currentInvoice.extractedData.items && currentInvoice.extractedData.items.length > 0 && (
                      <div>
                        <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Artículos</h4>
                        <div className="space-y-2">
                          {currentInvoice.extractedData.items.map((item: any, index: number) => (
                            <div key={index} className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
                              <div className="grid grid-cols-4 gap-2 text-sm">
                                <div className="col-span-2">
                                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{item.descripcion || 'Sin descripción'}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-zinc-600 dark:text-zinc-400">Cant: {item.cantidad || 0}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-semibold text-zinc-900 dark:text-white">${item.total?.toFixed(2) || '0.00'}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Totales */}
                    <div className="border-t-2 border-zinc-200 dark:border-zinc-700 pt-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-zinc-700 dark:text-zinc-300">
                          <span>Subtotal:</span>
                          {isEditing ? (
                            <input 
                              type="number" 
                              step="0.01"
                              value={editedData?.subtotal || 0} 
                              onChange={(e) => setEditedData({...editedData!, subtotal: parseFloat(e.target.value) || 0})}
                              className="w-32 px-3 py-1 border border-blue-500 rounded-lg text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 text-right"
                            />
                          ) : (
                            <span className="font-semibold">${currentInvoice.extractedData.subtotal?.toFixed(2) || '0.00'}</span>
                          )}
                        </div>
                        <div className="flex justify-between items-center text-zinc-700 dark:text-zinc-300">
                          <span>IVA:</span>
                          {isEditing ? (
                            <input 
                              type="number" 
                              step="0.01"
                              value={editedData?.iva || 0} 
                              onChange={(e) => setEditedData({...editedData!, iva: parseFloat(e.target.value) || 0})}
                              className="w-32 px-3 py-1 border border-blue-500 rounded-lg text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 text-right"
                            />
                          ) : (
                            <span className="font-semibold">${currentInvoice.extractedData.iva?.toFixed(2) || '0.00'}</span>
                          )}
                        </div>
                        <div className="flex justify-between items-center text-lg font-bold text-zinc-900 dark:text-white border-t-2 border-zinc-300 dark:border-zinc-600 pt-2">
                          <span>Total:</span>
                          {isEditing ? (
                            <input 
                              type="number" 
                              step="0.01"
                              value={editedData?.total || 0} 
                              onChange={(e) => setEditedData({...editedData!, total: parseFloat(e.target.value) || 0})}
                              className="w-32 px-3 py-1 border border-blue-500 rounded-lg text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 text-right font-bold"
                            />
                          ) : (
                            <span>${currentInvoice.extractedData.total?.toFixed(2) || '0.00'}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Información adicional */}
                    {(currentInvoice.extractedData.formaPago || currentInvoice.extractedData.metodoPago || currentInvoice.extractedData.observaciones || isEditing) && (
                      <div>
                        <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Información Adicional</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Forma de Pago</label>
                            <input 
                              type="text" 
                              value={isEditing ? (editedData?.formaPago || '') : (currentInvoice.extractedData.formaPago || '')} 
                              onChange={(e) => isEditing && setEditedData({...editedData!, formaPago: e.target.value})}
                              readOnly={!isEditing}
                              className={`mt-1 w-full px-3 py-2 border rounded-lg text-zinc-900 dark:text-white ${isEditing ? 'bg-white dark:bg-zinc-800 border-blue-500' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600'}`}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Método de Pago</label>
                            <input 
                              type="text" 
                              value={isEditing ? (editedData?.metodoPago || '') : (currentInvoice.extractedData.metodoPago || '')} 
                              onChange={(e) => isEditing && setEditedData({...editedData!, metodoPago: e.target.value})}
                              readOnly={!isEditing}
                              className={`mt-1 w-full px-3 py-2 border rounded-lg text-zinc-900 dark:text-white ${isEditing ? 'bg-white dark:bg-zinc-800 border-blue-500' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600'}`}
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Observaciones</label>
                            <textarea 
                              value={isEditing ? (editedData?.observaciones || '') : (currentInvoice.extractedData.observaciones || '')} 
                              onChange={(e) => isEditing && setEditedData({...editedData!, observaciones: e.target.value})}
                              readOnly={!isEditing}
                              rows={3} 
                              className={`mt-1 w-full px-3 py-2 border rounded-lg text-zinc-900 dark:text-white ${isEditing ? 'bg-white dark:bg-zinc-800 border-blue-500' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600'}`}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit/Save Buttons */}
                {!currentInvoice.isValidated && (
                  <div className="space-y-3">
                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(true);
                          setEditedData(currentInvoice.extractedData);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        ✏️ Modificar Factura
                      </button>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false);
                            setEditedData(null);
                          }}
                          className="flex-1 bg-zinc-400 hover:bg-zinc-500 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
                        >
                          ❌ Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setInvoices(prev => prev.map((inv, idx) => 
                              idx === currentIndex 
                                ? { ...inv, extractedData: editedData }
                                : inv
                            ));
                            setIsEditing(false);
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
                        >
                          💾 Guardar Cambios
                        </button>
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={handleValidate}
                      disabled={validating || isEditing}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
                    >
                      {validating ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Validando...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          ✅ Validar y Guardar en BD
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Success Message - Above Reset Button */}
                {successMessage && (
                  <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg p-4">
                    <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 font-semibold text-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {successMessage}
                    </div>
                  </div>
                )}

                {/* Reset Button */}
                <button
                  onClick={handleReset}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                >
                  🔄 Nueva Factura
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
