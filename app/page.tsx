'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const isAuth = localStorage.getItem('isAuthenticated');
    
    if (isAuth) {
      // Si está autenticado, redirigir al dashboard
      router.push('/dashboard');
    } else {
      // Si no está autenticado, redirigir al login
      router.push('/login');
    }
  }, [router]);

  // Mostrar un loading mientras se redirige
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black">
      <div className="text-center">
        <Image
          className="dark:invert mx-auto mb-8"
          src="/next.svg"
          alt="Logo"
          width={120}
          height={24}
          priority
        />
        <div className="flex items-center justify-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">Cargando...</p>
        </div>
      </div>
    </div>
  );
}
