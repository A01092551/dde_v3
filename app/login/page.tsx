'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('═══════════════════════════════════════════════════════');
    console.log('🔐 [FRONTEND] LOGIN PROCESS STARTED');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📧 Email entered:', email);
    console.log('🔒 Password length:', password.length, 'characters');
    console.log('⏰ Timestamp:', new Date().toISOString());

    // Validación básica
    if (!email || !password) {
      console.log('❌ [FRONTEND] Validation failed: Empty fields');
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    console.log('✅ [FRONTEND] Client-side validation passed');

    try {
      console.log('📤 [FRONTEND] Preparing API request...');
      console.log('   → Endpoint: POST /api/login');
      console.log('   → Content-Type: application/json');
      console.log('   → Payload:', { email, password: '***hidden***' });
      
      const requestStartTime = performance.now();
      
      // Call login API
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const requestEndTime = performance.now();
      const requestDuration = (requestEndTime - requestStartTime).toFixed(2);

      console.log('📥 [FRONTEND] Response received from backend');
      console.log('   → Status:', response.status, response.statusText);
      console.log('   → Duration:', requestDuration, 'ms');
      console.log('   → Headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('📋 [FRONTEND] Response data parsed:', data);

      if (!response.ok) {
        console.log('❌ [FRONTEND] Login failed');
        console.log('   → Error:', data.error);
        console.log('   → Status code:', response.status);
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      console.log('✅ [FRONTEND] Login successful!');
      console.log('👤 User data received:');
      console.log('   → ID:', data.user.id);
      console.log('   → Name:', data.user.name);
      console.log('   → Email:', data.user.email);
      console.log('   → Role:', data.user.role);

      // Save session
      console.log('💾 [FRONTEND] Saving session to localStorage...');
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', data.user.email);
      localStorage.setItem('userName', data.user.name);
      localStorage.setItem('userId', data.user.id.toString());
      localStorage.setItem('userRole', data.user.role);
      console.log('✅ [FRONTEND] Session saved successfully');
      
      // Redirect to dashboard
      console.log('🚀 [FRONTEND] Redirecting to dashboard...');
      console.log('═══════════════════════════════════════════════════════');
      console.log('✅ [FRONTEND] LOGIN PROCESS COMPLETED SUCCESSFULLY');
      console.log('═══════════════════════════════════════════════════════');
      router.push('/dashboard');
    } catch (err) {
      console.log('═══════════════════════════════════════════════════════');
      console.error('❌ [FRONTEND] LOGIN PROCESS FAILED WITH EXCEPTION');
      console.log('═══════════════════════════════════════════════════════');
      console.error('💥 Exception details:', err);
      console.error('   → Error type:', err instanceof Error ? err.constructor.name : typeof err);
      console.error('   → Error message:', err instanceof Error ? err.message : String(err));
      if (err instanceof Error && err.stack) {
        console.error('   → Stack trace:', err.stack);
      }
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              className="dark:invert"
              src="/next.svg"
              alt="Logo"
              width={120}
              height={24}
              priority
            />
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-center text-zinc-900 dark:text-white mb-2">
            Log In
          </h1>
          <p className="text-center text-zinc-600 dark:text-zinc-400 mb-8">
            Welcome back to FacturaAI
          </p>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
                disabled={loading}
              />
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
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </>
              ) : (
                'Log In'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Don't have an account?{' '}
            <button
              onClick={() => router.push('/signup')}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Sign Up
            </button>
          </div>
          
          <div className="mt-3 text-center text-sm text-zinc-600 dark:text-zinc-400">
            <button
              onClick={() => router.push('/')}
              className="text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
