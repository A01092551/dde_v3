# 🔧 Troubleshooting Guide

## 📋 Common Issues

### Issue 1: PDF Extraction JSON Parse Error ⚠️ **FIXED**

**Problem:**
```
SyntaxError: Expected ',' or ']' after array element in JSON at position 597
```

**Cause:** OpenAI's response sometimes contains malformed JSON with trailing commas or formatting issues.

**Solution:** ✅ **Already implemented** - The code now:
1. Tries to extract JSON from code blocks first (```json ... ```)
2. Falls back to raw JSON extraction
3. Automatically cleans common JSON issues:
   - Removes trailing commas
   - Normalizes whitespace
   - Handles newlines and tabs
4. Provides detailed error logging

**What to do:** Just retry the PDF upload. The improved parser should handle it now.

---

### Issue 2: No Facturas Visible

## 🐛 Problema Identificado

Basado en los logs, hay **DOS problemas**:

### 1. ❌ Error de OpenAI API Key
```
Error: The OPENAI_API_KEY environment variable is missing or empty
```

### 2. ❌ Error de conexión MongoDB (SSL Timeout)
```
MongoServerSelectionError: SSL routines:ssl3_read_bytes:tlsv1 alert internal error
```

---

## ✅ Soluciones

### **Solución 1: Configurar Variables de Entorno**

#### **Opción A: Usar .env.local (Recomendado para desarrollo local)**

1. Asegúrate de que el archivo `.env.local` existe y tiene:

```bash
# OpenAI API Key
OPENAI_API_KEY=sk-proj-TU_KEY_COMPLETA_AQUI

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/?retryWrites=true&w=majority

# MongoDB Database Name
MONGODB_DB=facturas_db
```

2. **Reemplaza:**
   - `TU_KEY_COMPLETA_AQUI` con tu OpenAI API key real
   - `USERNAME:PASSWORD` con tus credenciales de MongoDB
   - `CLUSTER` con el nombre de tu cluster

3. **Reinicia el servidor:**
```bash
npm run dev
```

---

#### **Opción B: Usar Codespaces Secrets (Para GitHub Codespaces)**

1. Ve a tu repositorio en GitHub
2. **Settings** → **Secrets and variables** → **Codespaces**
3. Agrega estos secrets:
   - `OPENAI_API_KEY`
   - `MONGODB_URI`
   - `MONGODB_DB`
4. **Reinicia el Codespace** (Stop → Start)

---

### **Solución 2: Verificar Conexión a MongoDB**

#### **Test de Conexión:**

Ejecuta el script de diagnóstico:

```bash
node test-mongodb-connection.js
```

**Respuesta esperada:**
```
✅ Conexión exitosa!
📚 Colecciones disponibles:
   - facturas
📊 Estadísticas:
   Total de facturas: 5
```

---

#### **Si falla la conexión:**

##### **A. Verificar IP Whitelist en MongoDB Atlas**

1. Ve a https://cloud.mongodb.com/
2. Haz clic en **Network Access**
3. Asegúrate de tener una de estas opciones:
   - **0.0.0.0/0** (Permitir desde cualquier IP) - Para desarrollo
   - Tu IP actual agregada a la lista

##### **B. Verificar Connection String**

El formato correcto es:
```
mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=AppName
```

**Errores comunes:**
- ❌ Falta reemplazar `<password>` con la contraseña real
- ❌ Contraseña con caracteres especiales sin codificar (usa %40 para @, %23 para #, etc.)
- ❌ Nombre de cluster incorrecto

##### **C. Obtener Connection String correcto:**

1. Ve a MongoDB Atlas
2. Haz clic en **Connect** en tu cluster
3. Selecciona **Drivers**
4. Copia el connection string
5. Reemplaza `<password>` con tu contraseña real

---

### **Solución 3: Verificar que el código está actualizado**

El código RESTful está correcto, pero verifica que:

1. **El endpoint GET funciona:**
```bash
# Desde la terminal
curl http://localhost:3000/api/invoices
```

**Respuesta esperada:**
```json
{
  "data": [...],
  "pagination": {...}
}
```

2. **Si no hay facturas:**
```json
{
  "data": [],
  "pagination": {
    "total": 0
  }
}
```

Esto es normal si no has guardado facturas aún.

---

## 🧪 Prueba Completa

### **1. Verificar variables de entorno**

```bash
# En Windows PowerShell
echo $env:OPENAI_API_KEY
echo $env:MONGODB_URI

# En Git Bash / Linux / Mac
echo $OPENAI_API_KEY
echo $MONGODB_URI
```

### **2. Probar conexión a MongoDB**

```bash
node test-mongodb-connection.js
```

### **3. Iniciar el servidor**

```bash
npm run dev
```

### **4. Probar el endpoint**

```bash
# Listar facturas
curl http://localhost:3000/api/invoices

# O en el navegador
http://localhost:3000/api/invoices
```

### **5. Probar desde la interfaz**

1. Ve a http://localhost:3000/login
2. Inicia sesión
3. Ve a **Ver Facturas**
4. Deberías ver las facturas guardadas

---

## 📊 Diagnóstico Rápido

| Síntoma | Causa Probable | Solución |
|---------|----------------|----------|
| "OPENAI_API_KEY missing" | Variable no configurada | Agregar a .env.local |
| "MongoServerSelectionError" | No puede conectar a MongoDB | Verificar MONGODB_URI y Network Access |
| "SSL alert internal error" | Problema de certificado SSL | Actualizar connection string |
| "No se encontraron facturas" | No hay facturas en la BD | Cargar facturas desde /extraccion |
| Timeout de 10s | MongoDB no responde | Verificar IP whitelist |

---

## 🔍 Logs Útiles

### **Ver logs del servidor:**

Los logs aparecen en la terminal donde ejecutas `npm run dev`:

```
✓ Ready in 2.5s
○ Local:   http://localhost:3000

GET /api/invoices 200 in 45ms
POST /api/invoices 500 in 10.0s  ← Error aquí
```

### **Ver logs en el navegador:**

1. Abre DevTools (F12)
2. Ve a la pestaña **Console**
3. Busca errores en rojo

---

## ✅ Checklist de Verificación

Antes de reportar un problema, verifica:

- [ ] `.env.local` existe y tiene las 3 variables
- [ ] Las variables no tienen espacios ni comillas extra
- [ ] MongoDB Atlas tiene 0.0.0.0/0 en Network Access
- [ ] El connection string es correcto y tiene la contraseña real
- [ ] El servidor se reinició después de agregar variables
- [ ] `node test-mongodb-connection.js` funciona
- [ ] `curl http://localhost:3000/api/invoices` retorna JSON

---

## 🆘 Si nada funciona

1. **Elimina node_modules y reinstala:**
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

2. **Verifica la versión de Node.js:**
```bash
node --version  # Debe ser >= 18.17.0
```

3. **Prueba con un .env.local limpio:**
```bash
# Crea un backup
cp .env.local .env.local.backup

# Crea uno nuevo desde la plantilla
cp env-template.txt .env.local

# Edita y agrega tus valores
code .env.local
```

---

## 📞 Información de Debug

Si necesitas ayuda, proporciona:

1. Output de `node test-mongodb-connection.js`
2. Logs del servidor (sin mostrar las API keys)
3. Respuesta de `curl http://localhost:3000/api/invoices`
4. Sistema operativo y versión de Node.js
