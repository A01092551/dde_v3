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

export default function ExtraccionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<FacturaData | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Verificar autenticación
    const isAuth = localStorage.getItem('isAuthenticated');
    if (!isAuth) {
      router.push('/login');
    }
  }, [router]);

  // Cleanup: Revoke object URL when component unmounts
  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      
      if (validTypes.includes(droppedFile.type)) {
        setFile(droppedFile);
        setFilePreviewUrl(URL.createObjectURL(droppedFile));
        setError('');
      } else {
        setError('Por favor, sube archivos PDF o imágenes (PNG, JPG, WEBP)');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      
      if (validTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
        setFilePreviewUrl(URL.createObjectURL(selectedFile));
        setError('');
      } else {
        setError('Por favor, sube archivos PDF o imágenes (PNG, JPG, WEBP)');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📄 [FRONTEND] INVOICE EXTRACTION PROCESS STARTED');
    console.log('═══════════════════════════════════════════════════════');
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    if (!file) {
      console.log('❌ [FRONTEND] Validation failed: No file selected');
      setError('Por favor, selecciona un archivo (PDF o imagen)');
      return;
    }

    console.log('📎 File selected:');
    console.log('   → Name:', file.name);
    console.log('   → Type:', file.type);
    console.log('   → Size:', (file.size / 1024).toFixed(2), 'KB');
    console.log('   → Last modified:', new Date(file.lastModified).toISOString());

    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('\n📦 [FRONTEND] Preparing FormData...');
      const formData = new FormData();
      formData.append('file', file);
      console.log('✅ [FRONTEND] FormData created with file');

      const apiUrl = getApiUrl(API_CONFIG.ENDPOINTS.EXTRACT_INVOICE);
      console.log('\n📤 [FRONTEND] Sending extraction request...');
      console.log('   → Endpoint: POST', apiUrl);
      console.log('   → Content-Type: multipart/form-data');
      console.log('   → File size:', file.size, 'bytes');
      
      const requestStartTime = performance.now();

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      const requestEndTime = performance.now();
      const requestDuration = (requestEndTime - requestStartTime).toFixed(2);

      console.log('\n📥 [FRONTEND] Response received from backend');
      console.log('   → Status:', response.status, response.statusText);
      console.log('   → Duration:', requestDuration, 'ms');
      console.log('   → Content-Type:', response.headers.get('content-type'));

      if (!response.ok) {
        console.log('❌ [FRONTEND] Extraction failed');
        console.log('   → Status code:', response.status);
        throw new Error('Error al procesar la factura');
      }

      console.log('\n📋 [FRONTEND] Parsing response data...');
      const data = await response.json();
      console.log('✅ [FRONTEND] Response parsed successfully');
      console.log('\n📊 [FRONTEND] Extracted data summary:');
      console.log('   → Invoice number:', data.numeroFactura || 'N/A');
      console.log('   → Date:', data.fecha || 'N/A');
      console.log('   → Total:', data.total || 'N/A');
      console.log('   → Items count:', data.items?.length || 0);
      console.log('   → Metadata:', data.metadata);
      console.log('\n📄 [FRONTEND] Full extracted data:', data);
      
      setResult(data);
      
      console.log('═══════════════════════════════════════════════════════');
      console.log('✅ [FRONTEND] EXTRACTION COMPLETED SUCCESSFULLY');
      console.log('═══════════════════════════════════════════════════════\n');
    } catch (err) {
      console.log('\n═══════════════════════════════════════════════════════');
      console.error('❌ [FRONTEND] EXTRACTION FAILED WITH ERROR');
      console.log('═══════════════════════════════════════════════════════');
      console.error('💥 Error details:', err);
      console.error('   → Error type:', err instanceof Error ? err.constructor.name : typeof err);
      console.error('   → Error message:', err instanceof Error ? err.message : String(err));
      if (err instanceof Error && err.stack) {
        console.error('   → Stack trace:', err.stack);
      }
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    router.push('/login');
  };

  const handleReset = () => {
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setFile(null);
    setFilePreviewUrl(null);
    setResult(null);
    setError('');
    setSuccessMessage('');
    setIsValidated(false);
  };

  const handleValidate = async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ [FRONTEND] VALIDATION & SAVE PROCESS STARTED');
    console.log('═══════════════════════════════════════════════════════');
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    if (!result) {
      console.log('❌ [FRONTEND] Validation failed: No extracted data');
      setError('No hay datos para validar');
      return;
    }

    if (!file) {
      console.log('❌ [FRONTEND] Validation failed: No file available');
      setError('No hay archivo para subir');
      return;
    }

    console.log('📋 [FRONTEND] Data to validate:');
    console.log('   → Invoice number:', result.numeroFactura);
    console.log('   → File name:', file.name);
    console.log('   → File size:', file.size, 'bytes');

    setValidating(true);
    setError('');
    setSuccessMessage('');

    try {
      console.log('\n📦 [FRONTEND] Preparing validation request...');
      // Send JSON data directly (FastAPI expects JSON, not FormData)
      console.log('✅ [FRONTEND] Preparing JSON payload');

      const apiUrl = getApiUrl(API_CONFIG.ENDPOINTS.VALIDATE_INVOICE);
      console.log('\n📤 [FRONTEND] Sending validation request...');
      console.log('   → Endpoint: POST', apiUrl);
      console.log('   → Content-Type: application/json');
      console.log('   → Data size:', JSON.stringify(result).length, 'characters');
      
      const requestStartTime = performance.now();

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      });

      const requestEndTime = performance.now();
      const requestDuration = (requestEndTime - requestStartTime).toFixed(2);

      console.log('\n📥 [FRONTEND] Response received from backend');
      console.log('   → Status:', response.status, response.statusText);
      console.log('   → Duration:', requestDuration, 'ms');

      const data = await response.json();
      console.log('📋 [FRONTEND] Response data:', data);

      if (!response.ok) {
        console.log('❌ [FRONTEND] Validation failed');
        console.log('   → Status code:', response.status);
        if (response.status === 409) {
          console.log('   → Reason: Duplicate invoice detected');
          throw new Error('Esta factura ya ha sido validada anteriormente');
        }
        console.log('   → Error:', data.error);
        throw new Error(data.error || 'Error al validar la factura');
      }

      console.log('✅ [FRONTEND] Validation successful!');
      console.log('   → Invoice ID:', data.id);
      console.log('   → Invoice number:', data.numeroFactura);
      console.log('   → S3 URL:', data.s3Url);
      
      setSuccessMessage(`✅ Factura validada y guardada exitosamente (ID: ${data.id})`);
      setIsValidated(true);
      
      console.log('═══════════════════════════════════════════════════════');
      console.log('✅ [FRONTEND] VALIDATION & SAVE COMPLETED SUCCESSFULLY');
      console.log('═══════════════════════════════════════════════════════\n');
    } catch (err) {
      console.log('\n═══════════════════════════════════════════════════════');
      console.error('❌ [FRONTEND] VALIDATION FAILED WITH ERROR');
      console.log('═══════════════════════════════════════════════════════');
      console.error('💥 Error details:', err);
      console.error('   → Error type:', err instanceof Error ? err.constructor.name : typeof err);
      console.error('   → Error message:', err instanceof Error ? err.message : String(err));
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
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Upload & Preview Section */}
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">
              �️ Vista Previa
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
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
              >
                <input
                  type="file"
                  id="file-upload"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {!file ? (
                  <div className="flex items-center justify-between">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium whitespace-nowrap">
                        Seleccionar Archivo
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
                          Arrastra tu factura aquí
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          PDF o imagen (PNG, JPG, WEBP)
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition font-medium"
                    >
                      Cambiar archivo
                    </button>
                    <div className="flex items-center gap-4">
                      <svg
                        className="w-12 h-12 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <p className="text-base font-medium text-zinc-700 dark:text-zinc-300">
                          {file.name}
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
                  {successMessage}
                </div>
              )}

            </form>

            {/* Divider */}
            <div className="my-6 border-t border-zinc-200 dark:border-zinc-700"></div>

            {/* Preview Section - Fixed Height */}
            <div className="h-[600px] bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
              {!filePreviewUrl ? (
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
                    La vista previa aparecerá aquí
                  </p>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <div className="flex-1 bg-white dark:bg-zinc-800 rounded border-2 border-zinc-200 dark:border-zinc-700 overflow-hidden">
                    {file && file.type === 'application/pdf' ? (
                      <iframe
                        src={filePreviewUrl}
                        className="w-full h-full"
                        title="PDF Preview"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 p-4">
                        <img
                          src={filePreviewUrl}
                          alt="Invoice preview"
                          className="max-w-full max-h-full object-contain rounded"
                        />
                      </div>
                    )}
                  </div>
                  
                  {file && (
                    <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-4">
                      <span>📄 {file.name}</span>
                      <span>📏 {(file.size / 1024).toFixed(2)} KB</span>
                      <span>🔖 {file.type.split('/')[1].toUpperCase()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Extract Button - Always Visible */}
            <div className="mt-6">
              <button
                onClick={handleSubmit}
                disabled={!file || loading}
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
                ) : (
                  '🔍 Extraer Datos'
                )}
              </button>
            </div>
          </div>

          {/* Column 2: Extracted Data Section */}
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
              📊 Datos Extraídos
            </h2>

            {!result && !loading && (
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

            {loading && (
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

            {/* Extracted Data */}
            {result && (
              <div className="space-y-4">
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
                  <div className="bg-white dark:bg-zinc-800 rounded border-2 border-zinc-200 dark:border-zinc-700 p-4 max-h-[500px] overflow-y-auto">
                    <pre className="text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap font-mono">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                    }}
                    className="w-full mt-3 px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition font-medium text-sm"
                  >
                    📋 Copiar JSON
                  </button>
                </div>

                {/* Validate Button */}
                {!isValidated && (
                  <button
                    type="button"
                    onClick={handleValidate}
                    disabled={validating}
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
                        Validar y Guardar en BD
                      </>
                    )}
                  </button>
                )}

                {/* Validated Badge */}
                {isValidated && (
                  <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg p-4">
                    <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 font-semibold">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Factura validada y guardada
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
