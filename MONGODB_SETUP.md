# 🗄️ Configuración de MongoDB

Este documento explica cómo configurar MongoDB Atlas para el sistema de extracción de facturas.

## 📋 Requisitos

- Cuenta de MongoDB Atlas (gratuita)
- Connection string de tu cluster

## 🔧 Configuración

### 1. Variables de Entorno

Agrega las siguientes variables a tu archivo `.env.local`:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://anuar2712_db_user:<db_password>@facturascluster.tb0zlhs.mongodb.net/?appName=Facturascluster
MONGODB_DB=facturas_db
```

**Importante**: Reemplaza `<db_password>` con tu contraseña real de MongoDB.

### 2. Estructura de la Base de Datos

La aplicación crea automáticamente la siguiente estructura:

#### Colección: `facturas`

```javascript
{
  // Información básica
  numeroFactura: String,
  fecha: String,
  fechaVencimiento: String,
  
  // Proveedor
  proveedor: {
    nombre: String,
    rfc: String,
    nit: String,
    direccion: String,
    telefono: String
  },
  
  // Cliente
  cliente: {
    nombre: String,
    rfc: String,
    nit: String,
    direccion: String
  },
  
  // Items
  items: [{
    descripcion: String,
    cantidad: Number,
    precioUnitario: Number,
    total: Number
  }],
  
  // Totales
  subtotal: Number,
  iva: Number,
  total: Number,
  moneda: String,
  
  // Forma de pago
  formaPago: String,
  metodoPago: String,
  usoCFDI: String,
  
  // Observaciones
  observaciones: String,
  
  // Metadata
  metadata: {
    fileName: String (required),
    fileSize: Number,
    processedAt: Date (required),
    model: String,
    validatedAt: Date,
    validatedBy: String
  },
  
  // Timestamps automáticos
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Índices

La aplicación crea automáticamente los siguientes índices para optimizar las búsquedas:

- `numeroFactura`: Índice simple para búsquedas por número de factura
- `metadata.processedAt`: Índice descendente para ordenar por fecha de procesamiento
- `metadata.validatedAt`: Índice descendente para ordenar por fecha de validación

## 🚀 Uso

### Validar y Guardar Factura

1. Extrae los datos de una factura usando el botón "Extraer Datos"
2. Revisa los datos extraídos
3. Haz clic en el botón **"Validar y Guardar en BD"**
4. La factura se guardará en MongoDB

### Características de Validación

- ✅ **Detección de duplicados**: No permite guardar facturas con el mismo número
- ✅ **Validación automática**: Mongoose valida los datos antes de guardar
- ✅ **Timestamps**: Registra cuándo se creó y actualizó cada factura
- ✅ **Metadata completa**: Guarda información del archivo original y del procesamiento

## 📡 API Endpoints

### POST `/api/validate-invoice`

Valida y guarda una factura en la base de datos.

**Request Body:**
```json
{
  "numeroFactura": "F-001",
  "fecha": "2024-01-15",
  "proveedor": { ... },
  "cliente": { ... },
  "items": [ ... ],
  "total": 1500.00,
  "metadata": {
    "fileName": "factura.pdf",
    "fileSize": 527253,
    "processedAt": "2024-01-15T10:30:00Z",
    "model": "gpt-4o"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Factura validada y guardada exitosamente",
  "facturaId": "507f1f77bcf86cd799439011",
  "numeroFactura": "F-001"
}
```

**Response (Duplicado):**
```json
{
  "error": "Ya existe una factura con este número",
  "facturaId": "507f1f77bcf86cd799439011"
}
```

### GET `/api/validate-invoice`

Obtiene facturas validadas de la base de datos.

**Query Parameters:**
- `limit`: Número máximo de resultados (default: 50)
- `skip`: Número de resultados a saltar (paginación)
- `numeroFactura`: Buscar por número de factura (búsqueda parcial)

**Ejemplo:**
```
GET /api/validate-invoice?limit=10&skip=0&numeroFactura=F-001
```

**Response:**
```json
{
  "success": true,
  "facturas": [ ... ],
  "pagination": {
    "total": 100,
    "limit": 10,
    "skip": 0,
    "hasMore": true
  }
}
```

## 🔒 Seguridad

- ✅ El connection string está en `.env.local` (no se sube a GitHub)
- ✅ Mongoose valida todos los datos antes de guardar
- ✅ Los índices optimizan las consultas
- ✅ Detección de duplicados por número de factura

## 🐛 Troubleshooting

### Error: "MONGODB_URI no está definida"

**Solución**: Asegúrate de tener el archivo `.env.local` con la variable `MONGODB_URI`.

### Error: "MongoNetworkError"

**Solución**: 
1. Verifica que tu IP esté en la whitelist de MongoDB Atlas
2. Revisa que el connection string sea correcto
3. Verifica tu conexión a internet

### Error: "Authentication failed"

**Solución**: Verifica que la contraseña en el connection string sea correcta.

### Error: "Ya existe una factura con este número"

**Solución**: Esta factura ya fue validada anteriormente. Puedes:
1. Cambiar el número de factura si fue un error
2. Consultar la factura existente en la base de datos

## 📊 Monitoreo

Puedes monitorear tu base de datos desde MongoDB Atlas:

1. Ve a https://cloud.mongodb.com
2. Selecciona tu cluster "Facturascluster"
3. Haz clic en "Browse Collections"
4. Verás la colección `facturas` con todos los documentos guardados

## 🔄 Migración de Datos

Si necesitas migrar datos o hacer backups:

```bash
# Exportar datos
mongodump --uri="<tu-connection-string>" --db=facturas_db

# Importar datos
mongorestore --uri="<tu-connection-string>" --db=facturas_db dump/
```

## 📝 Notas Adicionales

- La base de datos se crea automáticamente al guardar la primera factura
- Los índices se crean automáticamente al iniciar la aplicación
- Mongoose maneja automáticamente la reconexión si se pierde la conexión
- En desarrollo, se usa una conexión persistente para evitar múltiples conexiones
