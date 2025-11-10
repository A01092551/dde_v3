# 📡 Ejemplos de Uso de API Endpoints

## 🎯 Resumen Rápido

- **POST `/api/validate-invoice`** → Guardar factura en MongoDB
- **GET `/api/validate-invoice`** → Consultar facturas guardadas

---

## 1️⃣ POST `/api/validate-invoice` - Guardar Factura

### ✅ Uso desde la Interfaz Web (Recomendado)

**El botón "Validar y Guardar en BD" ya hace esto automáticamente.**

1. Ve a `http://localhost:3000/extraccion`
2. Sube una factura (PDF o imagen)
3. Haz clic en "Extraer Datos"
4. Revisa los datos extraídos
5. Haz clic en **"Validar y Guardar en BD"**
6. ¡Listo! La factura se guarda en MongoDB

---

### 📝 Uso Programático

#### JavaScript/TypeScript (Fetch API)

```javascript
const facturaData = {
  numeroFactura: "F-12345",
  fecha: "2024-11-09",
  fechaVencimiento: "2024-12-09",
  proveedor: {
    nombre: "Proveedor Ejemplo S.A.",
    rfc: "PRO123456789",
    direccion: "Av. Principal 123, CDMX",
    telefono: "+52 55 1234 5678"
  },
  cliente: {
    nombre: "Cliente Demo S.A.",
    rfc: "CLI987654321",
    direccion: "Calle Secundaria 456, CDMX"
  },
  items: [
    {
      descripcion: "Servicio de Consultoría",
      cantidad: 10,
      precioUnitario: 1500.00,
      total: 15000.00
    },
    {
      descripcion: "Desarrollo de Software",
      cantidad: 1,
      precioUnitario: 25000.00,
      total: 25000.00
    }
  ],
  subtotal: 40000.00,
  iva: 6400.00,
  total: 46400.00,
  moneda: "MXN",
  formaPago: "Transferencia",
  metodoPago: "PUE",
  usoCFDI: "G03",
  observaciones: "Pago en una sola exhibición",
  metadata: {
    fileName: "factura_ejemplo.pdf",
    fileSize: 527253,
    processedAt: new Date().toISOString(),
    model: "gpt-4o"
  }
};

// Enviar a la API
const response = await fetch('http://localhost:3000/api/validate-invoice', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(facturaData)
});

const result = await response.json();

if (response.ok) {
  console.log('✅ Factura guardada:', result);
  // { success: true, message: "Factura validada y guardada exitosamente", facturaId: "...", numeroFactura: "F-12345" }
} else {
  console.error('❌ Error:', result.error);
  // { error: "Ya existe una factura con este número", facturaId: "..." }
}
```

#### Node.js (con axios)

```javascript
const axios = require('axios');

async function guardarFactura() {
  try {
    const response = await axios.post('http://localhost:3000/api/validate-invoice', {
      numeroFactura: "F-12345",
      fecha: "2024-11-09",
      total: 46400.00,
      moneda: "MXN",
      metadata: {
        fileName: "factura.pdf",
        fileSize: 527253,
        processedAt: new Date().toISOString(),
        model: "gpt-4o"
      }
    });

    console.log('✅ Factura guardada:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('❌ Error:', error.response.data);
    } else {
      console.error('❌ Error de red:', error.message);
    }
  }
}

guardarFactura();
```

#### cURL (Terminal/CMD)

```bash
curl -X POST http://localhost:3000/api/validate-invoice \
  -H "Content-Type: application/json" \
  -d '{
    "numeroFactura": "F-12345",
    "fecha": "2024-11-09",
    "proveedor": {
      "nombre": "Proveedor Ejemplo S.A.",
      "rfc": "PRO123456789"
    },
    "total": 46400.00,
    "moneda": "MXN",
    "metadata": {
      "fileName": "factura.pdf",
      "fileSize": 527253,
      "processedAt": "2024-11-09T10:30:00Z",
      "model": "gpt-4o"
    }
  }'
```

#### Python (con requests)

```python
import requests
from datetime import datetime

factura_data = {
    "numeroFactura": "F-12345",
    "fecha": "2024-11-09",
    "total": 46400.00,
    "moneda": "MXN",
    "metadata": {
        "fileName": "factura.pdf",
        "fileSize": 527253,
        "processedAt": datetime.now().isoformat(),
        "model": "gpt-4o"
    }
}

response = requests.post(
    'http://localhost:3000/api/validate-invoice',
    json=factura_data
)

if response.ok:
    print('✅ Factura guardada:', response.json())
else:
    print('❌ Error:', response.json())
```

---

## 2️⃣ GET `/api/validate-invoice` - Consultar Facturas

### ✅ Uso desde la Interfaz Web (Recomendado)

**Nueva página creada para ver facturas:**

1. Ve a `http://localhost:3000/facturas`
2. Verás todas las facturas guardadas
3. Usa la barra de búsqueda para filtrar por número

---

### 📝 Uso Programático

#### Obtener todas las facturas (primeras 50)

```javascript
const response = await fetch('http://localhost:3000/api/validate-invoice');
const data = await response.json();

console.log('Total de facturas:', data.pagination.total);
console.log('Facturas:', data.facturas);
```

#### Con paginación

```javascript
// Obtener 10 facturas, saltando las primeras 20
const response = await fetch('http://localhost:3000/api/validate-invoice?limit=10&skip=20');
const data = await response.json();

console.log('Facturas (página 3):', data.facturas);
console.log('¿Hay más?', data.pagination.hasMore);
```

#### Buscar por número de factura

```javascript
// Buscar facturas que contengan "F-001"
const response = await fetch('http://localhost:3000/api/validate-invoice?numeroFactura=F-001');
const data = await response.json();

console.log('Facturas encontradas:', data.facturas.length);
```

#### Combinando parámetros

```javascript
// Buscar "F-001", obtener 5 resultados, saltar los primeros 10
const url = new URL('http://localhost:3000/api/validate-invoice');
url.searchParams.append('numeroFactura', 'F-001');
url.searchParams.append('limit', '5');
url.searchParams.append('skip', '10');

const response = await fetch(url);
const data = await response.json();
```

#### cURL

```bash
# Obtener todas las facturas
curl http://localhost:3000/api/validate-invoice

# Con paginación
curl "http://localhost:3000/api/validate-invoice?limit=10&skip=0"

# Buscar por número
curl "http://localhost:3000/api/validate-invoice?numeroFactura=F-001"

# Combinado
curl "http://localhost:3000/api/validate-invoice?numeroFactura=F-001&limit=5&skip=0"
```

#### Python

```python
import requests

# Obtener todas las facturas
response = requests.get('http://localhost:3000/api/validate-invoice')
data = response.json()

print(f"Total: {data['pagination']['total']}")
for factura in data['facturas']:
    print(f"- {factura['numeroFactura']}: ${factura['total']}")

# Buscar por número
response = requests.get(
    'http://localhost:3000/api/validate-invoice',
    params={'numeroFactura': 'F-001'}
)
data = response.json()
print(f"Encontradas: {len(data['facturas'])}")
```

---

## 📊 Estructura de Respuestas

### POST - Éxito (200)

```json
{
  "success": true,
  "message": "Factura validada y guardada exitosamente",
  "facturaId": "673f8a1b2c3d4e5f6a7b8c9d",
  "numeroFactura": "F-12345"
}
```

### POST - Error Duplicado (409)

```json
{
  "error": "Ya existe una factura con este número",
  "facturaId": "673f8a1b2c3d4e5f6a7b8c9d"
}
```

### POST - Error de Validación (400)

```json
{
  "error": "Error de validación",
  "details": [
    "metadata.fileName is required",
    "metadata.processedAt is required"
  ]
}
```

### GET - Éxito (200)

```json
{
  "success": true,
  "facturas": [
    {
      "_id": "673f8a1b2c3d4e5f6a7b8c9d",
      "numeroFactura": "F-12345",
      "fecha": "2024-11-09",
      "total": 46400.00,
      "moneda": "MXN",
      "proveedor": {
        "nombre": "Proveedor Ejemplo S.A.",
        "rfc": "PRO123456789"
      },
      "metadata": {
        "fileName": "factura.pdf",
        "validatedAt": "2024-11-09T20:30:00.000Z"
      },
      "createdAt": "2024-11-09T20:30:00.000Z",
      "updatedAt": "2024-11-09T20:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "skip": 0,
    "hasMore": true
  }
}
```

---

## 🔧 Parámetros de Query (GET)

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `limit` | number | Número máximo de resultados (default: 50) | `?limit=10` |
| `skip` | number | Número de resultados a saltar (default: 0) | `?skip=20` |
| `numeroFactura` | string | Buscar por número de factura (búsqueda parcial) | `?numeroFactura=F-001` |

---

## 🎯 Casos de Uso Comunes

### 1. Guardar factura después de extraer datos

```javascript
// 1. Extraer datos
const formData = new FormData();
formData.append('file', pdfFile);

const extractResponse = await fetch('/api/extract-invoice', {
  method: 'POST',
  body: formData
});

const extractedData = await extractResponse.json();

// 2. Validar y guardar
const saveResponse = await fetch('/api/validate-invoice', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(extractedData)
});

const saveResult = await saveResponse.json();
console.log('Guardado:', saveResult);
```

### 2. Listar facturas con paginación

```javascript
async function listarFacturas(pagina = 1, porPagina = 10) {
  const skip = (pagina - 1) * porPagina;
  const response = await fetch(
    `http://localhost:3000/api/validate-invoice?limit=${porPagina}&skip=${skip}`
  );
  const data = await response.json();
  
  return {
    facturas: data.facturas,
    totalPaginas: Math.ceil(data.pagination.total / porPagina),
    paginaActual: pagina
  };
}

// Uso
const resultado = await listarFacturas(1, 10); // Primera página, 10 por página
console.log(`Página ${resultado.paginaActual} de ${resultado.totalPaginas}`);
```

### 3. Buscar y filtrar facturas

```javascript
async function buscarFacturas(termino) {
  const response = await fetch(
    `http://localhost:3000/api/validate-invoice?numeroFactura=${encodeURIComponent(termino)}`
  );
  const data = await response.json();
  return data.facturas;
}

// Uso
const facturas = await buscarFacturas('F-001');
console.log(`Encontradas: ${facturas.length} facturas`);
```

---

## 🚀 Acceso Rápido

### Desde el Navegador

- **Página de Extracción**: http://localhost:3000/extraccion
- **Página de Facturas Guardadas**: http://localhost:3000/facturas

### Endpoints API

- **POST Guardar**: http://localhost:3000/api/validate-invoice
- **GET Consultar**: http://localhost:3000/api/validate-invoice

---

## 💡 Tips

1. **Usa la interfaz web** para operaciones normales (más fácil)
2. **Usa los endpoints** para integraciones con otros sistemas
3. **Revisa MongoDB Atlas** para ver los datos guardados directamente
4. **Implementa paginación** si tienes muchas facturas
5. **Maneja errores** apropiadamente (duplicados, validación, etc.)
