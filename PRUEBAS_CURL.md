# 🧪 Pruebas con curl - Backend FastAPI

Este documento contiene ejemplos de cómo probar el backend FastAPI usando `curl` desde la línea de comandos.

## 📋 Prerequisitos

- Backend FastAPI corriendo en http://localhost:8000
- `curl` instalado (viene por defecto en Windows 10+, Linux y Mac)

## 🔍 Verificar que el Backend Está Corriendo

```bash
# Health check
curl http://localhost:8000/health
```

**Respuesta esperada:**
```json
{
  "status": "healthy",
  "service": "Invoice Extraction API",
  "version": "1.0.0"
}
```

## 🔐 Autenticación

### Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"admin123\"}"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### Login con credenciales incorrectas

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"wrong\"}"
```

**Respuesta esperada (401):**
```json
{
  "detail": "Invalid email or password"
}
```

## 📄 Extracción de Facturas

### Extraer datos de un PDF

```bash
curl -X POST http://localhost:8000/api/invoices/extract \
  -F "file=@ruta/a/tu/factura.pdf"
```

**Ejemplo con ruta real (Windows):**
```bash
curl -X POST http://localhost:8000/api/invoices/extract \
  -F "file=@C:\Users\Anuar\Documents\factura.pdf"
```

**Ejemplo con ruta real (Linux/Mac):**
```bash
curl -X POST http://localhost:8000/api/invoices/extract \
  -F "file=@/home/usuario/factura.pdf"
```

**Respuesta esperada:**
```json
{
  "numeroFactura": "F-001",
  "fecha": "2024-01-15",
  "total": 1000.00,
  "moneda": "MXN",
  "proveedor": {
    "nombre": "Empresa ABC",
    "rfc": "ABC123456789"
  },
  "metadata": {
    "fileName": "factura.pdf",
    "fileSize": 45678,
    "mimeType": "application/pdf",
    "processedAt": "2024-01-15T10:30:00.000Z",
    "model": "gpt-4o"
  }
}
```

### Extraer datos de una imagen

```bash
curl -X POST http://localhost:8000/api/invoices/extract \
  -F "file=@ruta/a/tu/factura.jpg"
```

## 💾 Guardar Facturas

### Validar y guardar factura en MongoDB

```bash
curl -X POST http://localhost:8000/api/invoices/validate \
  -H "Content-Type: application/json" \
  -d '{
    "numeroFactura": "F-001",
    "fecha": "2024-01-15",
    "total": 1000.00,
    "moneda": "MXN",
    "metadata": {
      "fileName": "factura.pdf",
      "processedAt": "2024-01-15T10:30:00.000Z",
      "model": "gpt-4o"
    }
  }'
```

**Respuesta esperada:**
```json
{
  "message": "Factura validada y guardada exitosamente",
  "id": "507f1f77bcf86cd799439011",
  "numeroFactura": "F-001"
}
```

### Intentar guardar factura duplicada

```bash
# Intenta guardar la misma factura dos veces
curl -X POST http://localhost:8000/api/invoices/validate \
  -H "Content-Type: application/json" \
  -d '{
    "numeroFactura": "F-001",
    "fecha": "2024-01-15",
    "total": 1000.00,
    "metadata": {
      "fileName": "factura.pdf",
      "processedAt": "2024-01-15T10:30:00.000Z"
    }
  }'
```

**Respuesta esperada (409 Conflict):**
```json
{
  "detail": "Ya existe una factura con el número F-001"
}
```

## 📋 Listar Facturas

### Obtener todas las facturas

```bash
curl http://localhost:8000/api/invoices
```

### Listar con paginación

```bash
# Primeras 10 facturas
curl "http://localhost:8000/api/invoices?limit=10&skip=0"

# Siguientes 10 facturas
curl "http://localhost:8000/api/invoices?limit=10&skip=10"
```

### Buscar por número de factura

```bash
curl "http://localhost:8000/api/invoices?numero=F-001"
```

**Respuesta esperada:**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "numeroFactura": "F-001",
      "fecha": "2024-01-15",
      "total": 1000.00,
      "metadata": {
        "fileName": "factura.pdf",
        "processedAt": "2024-01-15T10:30:00.000Z"
      }
    }
  ],
  "pagination": {
    "total": 1,
    "skip": 0,
    "limit": 50,
    "hasMore": false
  }
}
```

## 🔍 Obtener Factura por ID

```bash
curl http://localhost:8000/api/invoices/507f1f77bcf86cd799439011
```

**Respuesta esperada:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "numeroFactura": "F-001",
  "fecha": "2024-01-15",
  "total": 1000.00,
  "proveedor": {
    "nombre": "Empresa ABC"
  },
  "metadata": {
    "fileName": "factura.pdf",
    "processedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## 🗑️ Eliminar Factura

```bash
curl -X DELETE http://localhost:8000/api/invoices/507f1f77bcf86cd799439011
```

**Respuesta esperada:**
```json
{
  "message": "Factura eliminada exitosamente"
}
```

## 📊 Ver Respuestas Formateadas

Para ver las respuestas JSON formateadas, puedes usar `jq` (si lo tienes instalado):

```bash
# Instalar jq (opcional)
# Windows: choco install jq
# Linux: sudo apt-get install jq
# Mac: brew install jq

# Usar con curl
curl http://localhost:8000/api/invoices | jq
```

O puedes usar el flag `-v` de curl para ver más detalles:

```bash
curl -v http://localhost:8000/health
```

## 🔧 Opciones Útiles de curl

```bash
# Ver headers de respuesta
curl -i http://localhost:8000/health

# Ver solo el código de estado
curl -o /dev/null -s -w "%{http_code}\n" http://localhost:8000/health

# Guardar respuesta en archivo
curl http://localhost:8000/api/invoices > facturas.json

# Seguir redirecciones
curl -L http://localhost:8000

# Timeout de 30 segundos
curl --max-time 30 http://localhost:8000/api/invoices
```

## 🧪 Flujo Completo de Prueba

```bash
# 1. Verificar que el backend está corriendo
curl http://localhost:8000/health

# 2. Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"admin123\"}"

# 3. Extraer datos de factura
curl -X POST http://localhost:8000/api/invoices/extract \
  -F "file=@factura.pdf"

# 4. Guardar factura (usa los datos del paso 3)
curl -X POST http://localhost:8000/api/invoices/validate \
  -H "Content-Type: application/json" \
  -d '{
    "numeroFactura": "F-001",
    "fecha": "2024-01-15",
    "total": 1000.00,
    "metadata": {
      "fileName": "factura.pdf",
      "processedAt": "2024-01-15T10:30:00.000Z"
    }
  }'

# 5. Listar facturas guardadas
curl http://localhost:8000/api/invoices

# 6. Buscar factura específica
curl "http://localhost:8000/api/invoices?numero=F-001"
```

## 💡 Tips

1. **Reemplaza las rutas de archivos** con rutas reales en tu sistema
2. **Usa comillas dobles** para JSON en Windows
3. **Escapa las comillas** en el JSON con `\"`
4. **Verifica que el backend esté corriendo** antes de hacer las pruebas
5. **Revisa los logs del backend** para ver detalles de las peticiones

## 🐛 Troubleshooting

### Error: "curl: command not found"

**Solución:** Instala curl o usa PowerShell en Windows (curl viene incluido)

### Error: "Connection refused"

**Solución:** Verifica que el backend esté corriendo en http://localhost:8000

### Error: "Invalid JSON"

**Solución:** Verifica que el JSON esté bien formateado y las comillas escapadas

### Error: "File not found"

**Solución:** Verifica que la ruta al archivo sea correcta y el archivo exista
