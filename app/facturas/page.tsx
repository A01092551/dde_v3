'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getApiUrl, API_CONFIG } from '@/lib/api-config';

interface Item {
  descripcion?: string;
  cantidad?: number;
  precioUnitario?: number;
  total?: number;
}

interface Proveedor {
  nombre?: string;
  rfc?: string;
  nit?: string;
  direccion?: string;
  telefono?: string;
}

interface Cliente {
  nombre?: string;
  rfc?: string;
  nit?: string;
  direccion?: string;
}

interface Factura {
  _id: string;
  numeroFactura?: string;
  fecha?: string;
  fechaVencimiento?: string;
  proveedor?: Proveedor;
  cliente?: Cliente;
  items?: Item[];
  subtotal?: number;
  iva?: number;
  total?: number;
  moneda?: string;
  formaPago?: string;
  metodoPago?: string;
  usoCFDI?: string;
  observaciones?: string;
  metadata: {
    fileName: string;
    fileSize?: number;
    processedAt: string;
    model?: string;
    validatedAt: string;
    validatedBy?: string;
    s3Url?: string;
    s3Key?: string;
  };
  rawData?: any;
}

export default function FacturasPage() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editedData, setEditedData] = useState<Factura | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [signedImageUrl, setSignedImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Verificar autenticación
    const isAuth = localStorage.getItem('isAuthenticated');
    if (!isAuth) {
      router.push('/login');
      return;
    }

    loadFacturas();
  }, [router]);

  const loadFacturas = async (search?: string) => {
    setLoading(true);
    setError('');

    try {
      const endpoint = search 
        ? `${API_CONFIG.ENDPOINTS.LIST_INVOICES}?numero=${encodeURIComponent(search)}`
        : API_CONFIG.ENDPOINTS.LIST_INVOICES;
      const url = getApiUrl(endpoint);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Error al cargar facturas');
      }

      const data = await response.json();
      setFacturas(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar facturas');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadFacturas(searchTerm);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    router.push('/login');
  };

  const openDrawer = async (factura: Factura) => {
    setSelectedFactura(factura);
    setEditedData(JSON.parse(JSON.stringify(factura))); // Deep copy
    setIsDrawerOpen(true);
    setSaveSuccess(false);
    setSignedImageUrl(null);

    // Load signed URL if S3 key exists
    if (factura.metadata.s3Key) {
      setLoadingImage(true);
      try {
        const url = getApiUrl(`/api/invoices/image?key=${encodeURIComponent(factura.metadata.s3Key)}`);
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setSignedImageUrl(data.url);
        }
      } catch (error) {
        console.error('Error loading image:', error);
      } finally {
        setLoadingImage(false);
      }
    }
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setSelectedFactura(null);
      setEditedData(null);
      setSaveSuccess(false);
      setIsDeleteModalOpen(false);
    }, 300); // Wait for animation
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!editedData) return;

    setIsDeleting(true);
    try {
      const url = getApiUrl(API_CONFIG.ENDPOINTS.DELETE_INVOICE(editedData._id));
      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar factura');
      }

      // Remove from local state
      setFacturas(facturas.filter(f => f._id !== editedData._id));
      
      // Close modal and drawer
      setIsDeleteModalOpen(false);
      closeDrawer();
      
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar factura');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  const handleSaveChanges = async () => {
    if (!editedData) return;

    // Validar que los campos numéricos sean válidos
    const numericFields = ['subtotal', 'iva', 'total'];
    const invalidFields: string[] = [];

    for (const field of numericFields) {
      const value = editedData[field];
      if (value !== undefined && value !== null && value !== '') {
        if (isNaN(Number(value)) || typeof value === 'string') {
          invalidFields.push(field);
        }
      }
    }

    if (invalidFields.length > 0) {
      const fieldNames: { [key: string]: string } = {
        subtotal: 'Subtotal',
        iva: 'IVA',
        total: 'Total'
      };
      const invalidFieldNames = invalidFields.map(f => fieldNames[f]).join(', ');
      alert(`❌ No se puede guardar: Los campos ${invalidFieldNames} solo aceptan valores numéricos. Por favor, elimine las letras e ingrese solo números.`);
      return;
    }

    setIsSaving(true);
    try {
      const url = getApiUrl(API_CONFIG.ENDPOINTS.GET_INVOICE(editedData._id));
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedData),
      });

      if (!response.ok) {
        throw new Error('Error al guardar cambios');
      }

      const updatedFactura = await response.json();
      
      // Update local state
      setFacturas(facturas.map(f => 
        f._id === updatedFactura._id ? updatedFactura : f
      ));
      
      setSelectedFactura(updatedFactura);
      setEditedData(JSON.parse(JSON.stringify(updatedFactura)));
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (path: string, value: any) => {
    if (!editedData) return;
    
    // Validar campos numéricos (subtotal, iva, total)
    const numericFields = ['subtotal', 'iva', 'total'];
    const fieldName = path.split('.').pop();
    
    if (fieldName && numericFields.includes(fieldName)) {
      // Si el valor es NaN o está vacío, no actualizar
      if (value !== '' && isNaN(value)) {
        // No permitir valores no numéricos
        return;
      }
    }
    
    const newData = JSON.parse(JSON.stringify(editedData));
    const keys = path.split('.');
    let current: any = newData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setEditedData(newData);
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
              Facturas Guardadas
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
              onClick={() => router.push('/extraccion')}
              className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Cargar Facturas
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
        {/* Search Bar */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por número de factura..."
              className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                loadFacturas();
              }}
              className="px-6 py-2 bg-zinc-600 hover:bg-zinc-700 text-white font-semibold rounded-lg transition-colors"
            >
              Limpiar
            </button>
          </form>
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

        {/* Facturas List */}
        {!loading && facturas.length === 0 && (
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-12 text-center">
            <p className="text-zinc-500 dark:text-zinc-400">
              No se encontraron facturas guardadas
            </p>
          </div>
        )}

        {!loading && facturas.length > 0 && (
          <div className="grid gap-6">
            {facturas.map((factura) => (
              <div
                key={factura._id}
                onClick={() => openDrawer(factura)}
                className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all cursor-pointer hover:scale-[1.01]"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                      {factura.numeroFactura || 'Sin número'}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {factura.proveedor?.nombre || 'Sin proveedor'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {factura.moneda || '$'} {factura.total?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {factura.fecha || 'Sin fecha'}
                    </p>
                  </div>
                </div>
                
                <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 mt-4">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {factura.metadata.fileName}
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {new Date(factura.metadata.validatedAt).toLocaleString('es-MX')}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-end gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium">
                  <span>Ver detalles</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={closeDrawer}
        />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-3/4 lg:w-2/3 xl:w-1/2 bg-white dark:bg-zinc-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
        isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {editedData && (
          <div className="h-full flex flex-col">
            {/* Drawer Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white p-6 sticky top-0 z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">
                    {editedData.numeroFactura || 'Sin número'}
                  </h2>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{editedData.fecha || 'Sin fecha'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xl font-bold">{editedData.moneda || '$'} {editedData.total?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeDrawer}
                  className="ml-4 p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Success Message */}
              {saveSuccess && (
                <div className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 animate-pulse">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Cambios guardados exitosamente</span>
                </div>
              )}
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Document Preview Section */}
              {editedData.metadata.s3Key && (
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Documento Original
                  </h3>
                  <div className="bg-white dark:bg-zinc-900 rounded-lg border-2 border-zinc-200 dark:border-zinc-700 overflow-hidden">
                    {loadingImage ? (
                      <div className="flex items-center justify-center h-[500px]">
                        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    ) : signedImageUrl ? (
                      editedData.metadata.fileName.toLowerCase().endsWith('.pdf') ? (
                        <iframe
                          src={signedImageUrl}
                          className="w-full h-[500px]"
                          title="Invoice PDF"
                        />
                      ) : (
                        <div className="flex items-center justify-center p-4 bg-zinc-100 dark:bg-zinc-900">
                          <img
                            src={signedImageUrl}
                            alt="Invoice"
                            className="max-w-full max-h-[500px] object-contain rounded"
                          />
                        </div>
                      )
                    ) : (
                      <div className="flex items-center justify-center h-[500px] text-zinc-500">
                        No se pudo cargar la imagen
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-4">
                    <span>📄 {editedData.metadata.fileName}</span>
                    {editedData.metadata.fileSize && (
                      <span>📏 {(editedData.metadata.fileSize / 1024).toFixed(2)} KB</span>
                    )}
                  </div>
                </div>
              )}

              {/* Editable Data Section */}
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Datos de la Factura (Editable)
                </h3>

                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Número de Factura
                      </label>
                      <input
                        type="text"
                        value={editedData.numeroFactura || ''}
                        onChange={(e) => updateField('numeroFactura', e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={editedData.fecha || ''}
                        onChange={(e) => updateField('fecha', e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Fecha de Vencimiento
                      </label>
                      <input
                        type="date"
                        value={editedData.fechaVencimiento || ''}
                        onChange={(e) => updateField('fechaVencimiento', e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Moneda
                      </label>
                      <input
                        type="text"
                        value={editedData.moneda || ''}
                        onChange={(e) => updateField('moneda', e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Proveedor */}
                  <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
                    <h4 className="font-semibold text-zinc-900 dark:text-white mb-3">Proveedor</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          Nombre
                        </label>
                        <input
                          type="text"
                          value={editedData.proveedor?.nombre || ''}
                          onChange={(e) => updateField('proveedor.nombre', e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          RFC/NIT
                        </label>
                        <input
                          type="text"
                          value={editedData.proveedor?.rfc || editedData.proveedor?.nit || ''}
                          onChange={(e) => updateField('proveedor.rfc', e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          Dirección
                        </label>
                        <input
                          type="text"
                          value={editedData.proveedor?.direccion || ''}
                          onChange={(e) => updateField('proveedor.direccion', e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          Teléfono
                        </label>
                        <input
                          type="text"
                          value={editedData.proveedor?.telefono || ''}
                          onChange={(e) => updateField('proveedor.telefono', e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cliente */}
                  <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
                    <h4 className="font-semibold text-zinc-900 dark:text-white mb-3">Cliente</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          Nombre
                        </label>
                        <input
                          type="text"
                          value={editedData.cliente?.nombre || ''}
                          onChange={(e) => updateField('cliente.nombre', e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          RFC/NIT
                        </label>
                        <input
                          type="text"
                          value={editedData.cliente?.rfc || editedData.cliente?.nit || ''}
                          onChange={(e) => updateField('cliente.rfc', e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          Dirección
                        </label>
                        <input
                          type="text"
                          value={editedData.cliente?.direccion || ''}
                          onChange={(e) => updateField('cliente.direccion', e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Totales */}
                  <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
                    <h4 className="font-semibold text-zinc-900 dark:text-white mb-3">Totales</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          Subtotal
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editedData.subtotal || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateField('subtotal', val === '' ? '' : parseFloat(val));
                          }}
                          onKeyPress={(e) => {
                            // Permitir solo números, punto decimal y teclas de control
                            if (!/[0-9.]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'Enter') {
                              e.preventDefault();
                            }
                          }}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          IVA
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editedData.iva || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateField('iva', val === '' ? '' : parseFloat(val));
                          }}
                          onKeyPress={(e) => {
                            // Permitir solo números, punto decimal y teclas de control
                            if (!/[0-9.]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'Enter') {
                              e.preventDefault();
                            }
                          }}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          Total
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editedData.total || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateField('total', val === '' ? '' : parseFloat(val));
                          }}
                          onKeyPress={(e) => {
                            // Permitir solo números, punto decimal y teclas de control
                            if (!/[0-9.]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'Enter') {
                              e.preventDefault();
                            }
                          }}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
                    <h4 className="font-semibold text-zinc-900 dark:text-white mb-3">Información de Pago</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          Forma de Pago
                        </label>
                        <input
                          type="text"
                          value={editedData.formaPago || ''}
                          onChange={(e) => updateField('formaPago', e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          Método de Pago
                        </label>
                        <input
                          type="text"
                          value={editedData.metodoPago || ''}
                          onChange={(e) => updateField('metodoPago', e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          Uso CFDI
                        </label>
                        <input
                          type="text"
                          value={editedData.usoCFDI || ''}
                          onChange={(e) => updateField('usoCFDI', e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Observaciones
                    </label>
                    <textarea
                      value={editedData.observaciones || ''}
                      onChange={(e) => updateField('observaciones', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="bg-zinc-100 dark:bg-zinc-800 p-6 border-t border-zinc-200 dark:border-zinc-700 sticky bottom-0">
              <div className="flex gap-4">
                <button
                  onClick={handleDeleteClick}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar
                </button>
                <button
                  onClick={closeDrawer}
                  className="flex-1 px-6 py-3 bg-zinc-300 dark:bg-zinc-700 text-zinc-900 dark:text-white font-semibold rounded-lg hover:bg-zinc-400 dark:hover:bg-zinc-600 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <>
          {/* Modal Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4"
            onClick={handleDeleteCancel}
          >
            {/* Modal Content */}
            <div 
              className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                    Confirmar Eliminación
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>

              {/* Modal Body */}
              <div className="mb-6">
                <p className="text-zinc-700 dark:text-zinc-300 mb-4">
                  ¿Estás seguro de que deseas eliminar la factura{' '}
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {editedData?.numeroFactura || 'sin número'}
                  </span>
                  ?
                </p>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-red-800 dark:text-red-300">
                      <p className="font-semibold mb-1">Se eliminará permanentemente:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Todos los datos de la factura</li>
                        <li>El registro en la base de datos</li>
                        <li>No se eliminará el archivo en S3</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white font-semibold rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Sí, Eliminar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
