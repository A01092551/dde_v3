'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const router = useRouter();

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Calculate password strength
  const calculatePasswordStrength = (pwd: string): number => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    return Math.min(strength, 4);
  };

  // Real-time field validation
  const validateField = (field: string, value: string) => {
    const errors = { ...fieldErrors };

    switch (field) {
      case 'name':
        if (value.trim().length < 2) {
          errors.name = 'Name must be at least 2 characters';
        } else {
          delete errors.name;
        }
        break;
      case 'email':
        if (!validateEmail(value)) {
          errors.email = 'Please enter a valid email address';
        } else {
          delete errors.email;
        }
        break;
      case 'password':
        if (value.length < 6) {
          errors.password = 'Password must be at least 6 characters';
        } else {
          delete errors.password;
        }
        setPasswordStrength(calculatePasswordStrength(value));
        break;
      case 'confirmPassword':
        if (value !== password) {
          errors.confirmPassword = 'Passwords do not match';
        } else {
          delete errors.confirmPassword;
        }
        break;
    }

    setFieldErrors(errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Client-side validation
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Check if there are any field errors
    if (Object.keys(fieldErrors).length > 0) {
      setError('Please fix all errors before submitting');
      setLoading(false);
      return;
    }

    try {
      // Call signup API
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create account');
        setLoading(false);
        return;
      }

      // Success - save session and redirect
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', name);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Signup error:', err);
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

          {/* Title */}
          <h1 className="text-3xl font-bold text-center text-zinc-900 dark:text-white mb-2">
            Sign Up
          </h1>
          <p className="text-center text-zinc-600 dark:text-zinc-400 mb-8">
            Create your FacturaAI account
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label 
                htmlFor="name" 
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  validateField('name', e.target.value);
                }}
                onBlur={(e) => validateField('name', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${
                  fieldErrors.name
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-zinc-300 dark:border-zinc-600 focus:ring-blue-500'
                } bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:border-transparent outline-none transition`}
                placeholder="John Doe"
                disabled={loading}
              />
              {fieldErrors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.name}</p>
              )}
            </div>

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
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (e.target.value) validateField('email', e.target.value);
                }}
                onBlur={(e) => validateField('email', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${
                  fieldErrors.email
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-zinc-300 dark:border-zinc-600 focus:ring-blue-500'
                } bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:border-transparent outline-none transition`}
                placeholder="you@example.com"
                disabled={loading}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.email}</p>
              )}
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  validateField('password', e.target.value);
                  if (confirmPassword) validateField('confirmPassword', confirmPassword);
                }}
                onBlur={(e) => validateField('password', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${
                  fieldErrors.password
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-zinc-300 dark:border-zinc-600 focus:ring-blue-500'
                } bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:border-transparent outline-none transition`}
                placeholder="••••••••"
                disabled={loading}
              />
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.password}</p>
              )}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded ${
                          i < passwordStrength
                            ? passwordStrength <= 1
                              ? 'bg-red-500'
                              : passwordStrength === 2
                              ? 'bg-yellow-500'
                              : passwordStrength === 3
                              ? 'bg-blue-500'
                              : 'bg-green-500'
                            : 'bg-zinc-300 dark:bg-zinc-600'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {passwordStrength <= 1 && 'Weak password'}
                    {passwordStrength === 2 && 'Fair password'}
                    {passwordStrength === 3 && 'Good password'}
                    {passwordStrength === 4 && 'Strong password'}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label 
                htmlFor="confirmPassword" 
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  validateField('confirmPassword', e.target.value);
                }}
                onBlur={(e) => validateField('confirmPassword', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${
                  fieldErrors.confirmPassword
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-zinc-300 dark:border-zinc-600 focus:ring-blue-500'
                } bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:border-transparent outline-none transition`}
                placeholder="••••••••"
                disabled={loading}
              />
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.confirmPassword}</p>
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
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Already have an account?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Log In
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
