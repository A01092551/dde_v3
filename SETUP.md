# Guía de Configuración - Sistema de Extracción de Facturas

## 📋 Requisitos Previos
- Node.js 18+ instalado
- Una cuenta de OpenAI con acceso a la API
- API Key de OpenAI

## 🚀 Pasos de Instalación

### 1. Instalar Dependencias

Ejecuta el siguiente comando en la terminal desde la raíz del proyecto:

```bash
npm install openai
```

Esto instalará el SDK oficial de OpenAI para Node.js.

### 2. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
OPENAI_API_KEY=tu-api-key-aqui
```

**⚠️ IMPORTANTE:**
- Reemplaza `tu-api-key-aqui` con tu API Key real de OpenAI
- Puedes obtener tu API Key en: https://platform.openai.com/api-keys
- El archivo `.env.local` está en `.gitignore` por seguridad (no se subirá a Git)

### 3. Verificar la Instalación

Después de instalar las dependencias, verifica que el proyecto compile correctamente:

```bash
npm run dev
```

El servidor debería iniciar en `http://localhost:3000`

## 🎯 Rutas Disponibles

### `/login`
- Página de inicio de sesión
- Autenticación básica (puedes personalizarla según tus necesidades)

### `/extraccion`
- Interfaz para cargar facturas en PDF
- Extrae datos automáticamente usando OpenAI GPT-4 Vision
- Muestra los resultados en formato JSON

### `/api/extract-invoice`
- API endpoint que procesa las facturas
- Recibe archivos PDF
- Devuelve datos estructurados en JSON

## 📝 Estructura de Datos Extraídos

El sistema extrae la siguiente información de las facturas:

```json
{
  "numeroFactura": "string",
  "fecha": "string",
  "fechaVencimiento": "string",
  "proveedor": {
    "nombre": "string",
    "rfc": "string",
    "direccion": "string",
    "telefono": "string"
  },
  "cliente": {
    "nombre": "string",
    "rfc": "string",
    "direccion": "string"
  },
  "items": [
    {
      "descripcion": "string",
      "cantidad": "number",
      "precioUnitario": "number",
      "total": "number"
    }
  ],
  "subtotal": "number",
  "iva": "number",
  "total": "number",
  "moneda": "string",
  "formaPago": "string",
  "metodoPago": "string",
  "usoCFDI": "string",
  "observaciones": "string",
  "metadata": {
    "fileName": "string",
    "fileSize": "number",
    "processedAt": "string",
    "model": "gpt-4o"
  }
}
```

## 🔧 Configuración Avanzada

### Cambiar el Modelo de OpenAI

Edita el archivo `app/api/extract-invoice/route.ts` y modifica la línea:

```typescript
model: 'gpt-4o', // Puedes usar 'gpt-4-turbo', 'gpt-4', etc.
```

### Ajustar la Temperatura

Para respuestas más consistentes o creativas, ajusta el parámetro `temperature`:

```typescript
temperature: 0.1, // 0 = más determinista, 1 = más creativo
```

## 🐛 Solución de Problemas

### Error: "Cannot find module 'openai'"
- Asegúrate de haber ejecutado `npm install openai`
- Reinicia el servidor de desarrollo

### Error: "OpenAI API key not found"
- Verifica que el archivo `.env.local` existe
- Confirma que la variable se llama exactamente `OPENAI_API_KEY`
- Reinicia el servidor después de crear el archivo

### Error al procesar PDFs grandes
- OpenAI tiene límites de tamaño para imágenes/documentos
- Considera comprimir el PDF o usar una resolución menor
- El límite típico es ~20MB por archivo

## 💡 Notas Adicionales

- El sistema usa GPT-4 Vision (gpt-4o) que puede analizar imágenes y PDFs
- Los costos de API se basan en tokens procesados (consulta precios de OpenAI)
- La autenticación actual es básica (considera implementar un sistema más robusto para producción)

## 📞 Soporte

Para más información sobre la API de OpenAI:
- Documentación: https://platform.openai.com/docs
- Precios: https://openai.com/pricing
- Límites: https://platform.openai.com/account/limits
