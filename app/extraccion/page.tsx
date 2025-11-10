'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FacturaData | null>(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Verificar autenticación
    const isAuth = localStorage.getItem('isAuthenticated');
    if (!isAuth) {
      router.push('/login');
    }
  }, [router]);

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
        setError('');
      } else {
        setError('Por favor, sube archivos PDF o imágenes (PNG, JPG, WEBP)');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Por favor, selecciona un archivo (PDF o imagen)');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/extract-invoice', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al procesar la factura');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
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
    setFile(null);
    setResult(null);
    setError('');
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
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
              Cargar Factura
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Drag & Drop Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
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
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <svg
                        className="w-16 h-16 text-zinc-400 dark:text-zinc-500 mb-4"
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
                      <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Arrastra tu factura aquí
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                        PDF o imagen (PNG, JPG, WEBP)
                      </p>
                      <span className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                        Seleccionar Archivo
                      </span>
                    </div>
                  </label>
                ) : (
                  <div className="flex flex-col items-center">
                    <svg
                      className="w-16 h-16 text-green-500 mb-4"
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
                    <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      {file.name}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-sm text-red-600 dark:text-red-400 hover:underline"
                    >
                      Cambiar archivo
                    </button>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
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
                  'Extraer Datos'
                )}
              </button>
            </form>
          </div>

          {/* Results Section */}
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
              Datos Extraídos
            </h2>

            {!result && !loading && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
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
              <div className="flex flex-col items-center justify-center h-64">
                <svg className="animate-spin h-12 w-12 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Analizando factura con OpenAI...
                </p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                  <pre className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap font-mono">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                    }}
                    className="flex-1 px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition font-medium"
                  >
                    Copiar JSON
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Nueva Factura
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
