'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getApiUrl, API_CONFIG } from '@/lib/api-config';

interface HistoryEvent {
  invoiceNumber: string;
  user: string;
  wasModified: boolean;
  timestamp: string;
  action: string;
}

interface Stats {
  total: number;
  validated: number;
  modified: number;
  with_s3: number;
  by_user: Array<{ _id: string; count: number }>;
  by_month: Array<{ _id: string; count: number }>;
  history: HistoryEvent[];
}

interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  is_active: number;
  created_at: string;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'stats' | 'users'>('stats');
  
  // User management state
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    // Verificar autenticación
    const isAuth = localStorage.getItem('isAuthenticated');
    const userRole = localStorage.getItem('userRole');
    
    if (!isAuth) {
      router.push('/login');
      return;
    }

    // Verificar que el usuario sea admin
    if (userRole !== 'admin') {
      router.push('/dashboard');
      return;
    }

    loadStats();
    loadUsers();
  }, [router]);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [searchQuery, activeTab]);

  const loadStats = async () => {
    setLoading(true);
    setError('');

    try {
      const url = getApiUrl('/api/invoices/stats/summary');
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Error al cargar estadísticas');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    router.push('/login');
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const url = getApiUrl(`/api/auth/users${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Error al cargar usuarios');
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setShowUserMenu(true);
  };

  const handleUpdateRole = async (userId: number, newRole: 'user' | 'admin') => {
    try {
      const url = getApiUrl(`/api/auth/users/${userId}/role`);
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar rol');
      }

      // Reload users
      await loadUsers();
      setShowUserMenu(false);
      setSelectedUser(null);
    } catch (err) {
      alert('Error al actualizar el rol del usuario');
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const url = getApiUrl(`/api/auth/users/${userId}`);
      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar usuario');
      }

      // Reload users
      await loadUsers();
      setShowUserMenu(false);
      setSelectedUser(null);
    } catch (err) {
      alert('Error al eliminar el usuario');
      console.error(err);
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
              Administración - Estadísticas
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
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs Navigation */}
        <div className="mb-6">
          <div className="border-b border-zinc-200 dark:border-zinc-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('stats')}
                className={`${
                  activeTab === 'stats'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                📊 Estadísticas
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                👥 Gestión de Usuarios
              </button>
            </nav>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}

        {/* Stats Content */}
        {activeTab === 'stats' && !loading && stats && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Top Users */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6 h-full">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Top 5 Usuarios
                </h3>
                {stats.by_user.length > 0 ? (
                  <div className="space-y-4">
                    {stats.by_user.map((user, index) => (
                      <div key={user._id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
                            {user._id}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-20 bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                            <div 
                              className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full"
                              style={{ width: `${(user.count / stats.by_user[0].count) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold text-zinc-900 dark:text-white w-6 text-right">
                            {user.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-zinc-500 dark:text-zinc-400 py-8">
                    No hay datos disponibles
                  </p>
                )}
              </div>
            </div>

            {/* Center Column - Main Stats Cards */}
            <div className="lg:col-span-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Total Facturas */}
              <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Total de Facturas
                </h3>
                <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                  {stats.total}
                </p>
              </div>

              {/* Facturas Validadas */}
              <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Facturas Validadas
                </h3>
                <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                  {stats.validated}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                  {stats.total > 0 ? ((stats.validated / stats.total) * 100).toFixed(1) : 0}% del total
                </p>
              </div>

              {/* Facturas Modificadas */}
              <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Facturas Modificadas
                </h3>
                <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                  {stats.modified}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                  {stats.validated > 0 ? ((stats.modified / stats.validated) * 100).toFixed(1) : 0}% de validadas
                </p>
              </div>

              {/* Archivos en S3 */}
              <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Archivos en S3
                </h3>
                <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                  {stats.with_s3}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                  {stats.total > 0 ? ((stats.with_s3 / stats.total) * 100).toFixed(1) : 0}% del total
                </p>
              </div>
            </div>
            </div>

            {/* Right Column - History */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6 h-full">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Historial de Eventos
                </h3>
                {stats.history && stats.history.length > 0 ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {stats.history.map((event, index) => (
                      <div key={index} className="border-l-4 border-blue-500 dark:border-blue-400 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-r-lg">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                            {event.invoiceNumber}
                          </span>
                          {event.wasModified && (
                            <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full flex-shrink-0">
                              Modificada
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1 truncate">
                          👤 {event.user}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                            ✅ Validada
                          </span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-500">
                            {new Date(event.timestamp).toLocaleString('es-MX', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-zinc-500 dark:text-zinc-400 py-8">
                    No hay eventos disponibles
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Users Management Content */}
        {activeTab === 'users' && (
          <div>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-12 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                />
                <svg
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Users List */}
            {loadingUsers ? (
              <div className="flex justify-center items-center py-12">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                    <thead className="bg-zinc-50 dark:bg-zinc-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          Rol
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          Fecha de Registro
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-700">
                      {users.map((user) => (
                        <tr
                          key={user.id}
                          onClick={() => handleUserClick(user)}
                          className="hover:bg-zinc-50 dark:hover:bg-zinc-700 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 dark:text-blue-400 font-bold">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-zinc-900 dark:text-white">
                                  {user.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-zinc-900 dark:text-white">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.role === 'admin'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              }`}
                            >
                              {user.role === 'admin' ? '👑 Admin' : '👤 Usuario'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.is_active
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }`}
                            >
                              {user.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                            {new Date(user.created_at).toLocaleDateString('es-MX')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {users.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-zinc-500 dark:text-zinc-400">
                      {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* User Action Modal */}
        {showUserMenu && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowUserMenu(false)}>
            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Gestionar Usuario</h3>
                <button
                  onClick={() => setShowUserMenu(false)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-shrink-0 h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-2xl">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-zinc-900 dark:text-white">{selectedUser.name}</h4>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Rol actual:</span>
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      selectedUser.role === 'admin'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    }`}
                  >
                    {selectedUser.role === 'admin' ? '👑 Admin' : '👤 Usuario'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {selectedUser.role === 'user' ? (
                  <button
                    onClick={() => handleUpdateRole(selectedUser.id, 'admin')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    Promover a Administrador
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateRole(selectedUser.id, 'user')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Cambiar a Usuario Regular
                  </button>
                )}

                <button
                  onClick={() => handleDeleteUser(selectedUser.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar Usuario
                </button>

                <button
                  onClick={() => setShowUserMenu(false)}
                  className="w-full px-4 py-3 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
