'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Verificar autenticación
    const isAuth = localStorage.getItem('isAuthenticated');
    if (!isAuth) {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    router.push('/login');
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
              Sistema de Gestión de Facturas
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">
            Bienvenido al Sistema
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Selecciona una opción para comenzar
          </p>
        </div>

        {/* Menu Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Card 1: Cargar Facturas */}
          <button
            onClick={() => router.push('/extraccion')}
            className="group bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 text-left"
          >
            <div className="flex flex-col items-center text-center">
              {/* Icon */}
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                <svg
                  className="w-10 h-10 text-blue-600 dark:text-blue-400"
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
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
                Cargar Facturas
              </h3>

              {/* Description */}
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                Sube facturas en formato PDF o imagen para extraer automáticamente sus datos usando IA
              </p>

              {/* Features */}
              <ul className="text-sm text-zinc-500 dark:text-zinc-500 space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Soporte para PDF e imágenes
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Extracción automática con IA
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Validación y guardado en BD
                </li>
              </ul>

              {/* Button */}
              <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold group-hover:gap-3 transition-all">
                Ir a Cargar Facturas
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Card 2: Ver Facturas */}
          <button
            onClick={() => router.push('/facturas')}
            className="group bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 text-left"
          >
            <div className="flex flex-col items-center text-center">
              {/* Icon */}
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                <svg
                  className="w-10 h-10 text-green-600 dark:text-green-400"
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
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
                Ver Facturas Guardadas
              </h3>

              {/* Description */}
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                Consulta todas las facturas procesadas y almacenadas en la base de datos
              </p>

              {/* Features */}
              <ul className="text-sm text-zinc-500 dark:text-zinc-500 space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Búsqueda por número de factura
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Visualización detallada
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Historial completo
                </li>
              </ul>

              {/* Button */}
              <div className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold group-hover:gap-3 transition-all">
                Ir a Ver Facturas
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        {/* Stats Section (Optional) */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 text-center">
              Características del Sistema
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  ⚡
                </div>
                <h4 className="font-semibold text-zinc-900 dark:text-white mb-1">
                  Rápido
                </h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Procesamiento en segundos con OpenAI GPT-4o
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                  🎯
                </div>
                <h4 className="font-semibold text-zinc-900 dark:text-white mb-1">
                  Preciso
                </h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Extracción precisa de todos los campos
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  🔒
                </div>
                <h4 className="font-semibold text-zinc-900 dark:text-white mb-1">
                  Seguro
                </h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Almacenamiento seguro en MongoDB Atlas
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
