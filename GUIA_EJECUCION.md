# 🚀 Guía de Ejecución - Proyecto Separado Frontend/Backend

Este proyecto ahora está dividido en dos aplicaciones independientes:
- **Frontend**: Next.js (Puerto 3000)
- **Backend**: FastAPI (Puerto 8000)

## ⚡ Inicio Rápido

### Paso 1: Configurar Backend (FastAPI)

```bash
# Terminal 1 - Backend
cd backend

# Crear entorno virtual (solo primera vez)
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
# source venv/bin/activate

# Instalar dependencias (solo primera vez)
pip install -r requirements.txt

# Crear archivo .env (solo primera vez)
# Copia env-template.txt como .env y edita con tus credenciales:
# - OPENAI_API_KEY
# - MONGODB_URI
# - MONGODB_DB

# Ejecutar backend
python main.py
```

✅ **Backend corriendo en:** http://localhost:8000
📚 **Documentación API:** http://localhost:8000/docs

### Paso 2: Configurar Frontend (Next.js)

```bash
# Terminal 2 - Frontend
# (Desde la raíz del proyecto)

# Instalar dependencias (solo primera vez)
npm install

# Crear archivo .env.local (solo primera vez)
# Copia env-frontend-template.txt como .env.local

# Ejecutar frontend
npm run dev
```

✅ **Frontend corriendo en:** http://localhost:3000

## 📋 Checklist de Configuración

### Backend (carpeta `backend/`)

- [ ] Python 3.8+ instalado
- [ ] Entorno virtual creado (`python -m venv venv`)
- [ ] Entorno virtual activado
- [ ] Dependencias instaladas (`pip install -r requirements.txt`)
- [ ] Archivo `.env` creado con:
  - [ ] `OPENAI_API_KEY` configurado
  - [ ] `MONGODB_URI` configurado
  - [ ] `MONGODB_DB` configurado
- [ ] Backend ejecutándose (`python main.py`)
- [ ] http://localhost:8000/health responde "healthy"

### Frontend (raíz del proyecto)

- [ ] Node.js 18+ instalado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Archivo `.env.local` creado con:
  - [ ] `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000`
- [ ] Frontend ejecutándose (`npm run dev`)
- [ ] http://localhost:3000 carga correctamente

## 🧪 Probar que Funciona

### 1. Verificar Backend

```bash
# Debe responder: {"status": "healthy", ...}
curl http://localhost:8000/health
```

### 2. Verificar Frontend

Abre http://localhost:3000 en tu navegador

### 3. Probar Login

1. Ve a http://localhost:3000/login
2. Usa credenciales: `admin@example.com` / `admin123`
3. Deberías ser redirigido al dashboard

### 4. Probar Extracción

1. Ve a "Cargar Facturas"
2. Sube un PDF o imagen de factura
3. Haz clic en "Extraer Datos"
4. Verifica que se muestren los datos extraídos

## 🔧 Solución de Problemas

### Error: "Backend no responde"

**Síntoma:** El frontend muestra errores de conexión

**Solución:**
1. Verifica que el backend esté corriendo en http://localhost:8000
2. Revisa la consola del backend para ver errores
3. Verifica que `.env.local` tenga `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000`

### Error: "OpenAI API key not found"

**Síntoma:** Error al extraer datos de facturas

**Solución:**
1. Verifica que `backend/.env` tenga `OPENAI_API_KEY` configurado
2. Reinicia el backend después de editar `.env`

### Error: "MongoDB connection failed"

**Síntoma:** Error al guardar facturas

**Solución:**
1. Verifica que `backend/.env` tenga `MONGODB_URI` correcto
2. Verifica que tu IP esté en la whitelist de MongoDB Atlas
3. Verifica que la contraseña en el URI no tenga caracteres especiales sin codificar

### Error: "CORS"

**Síntoma:** Errores de CORS en la consola del navegador

**Solución:**
1. Verifica que el backend tenga CORS configurado para `http://localhost:3000`
2. Reinicia ambos servidores

## 📊 Flujo de Datos

```
Usuario → Frontend (3000) → Backend (8000) → OpenAI/MongoDB → Backend → Frontend → Usuario
```

## 🔍 Ver Logs

### Backend (Terminal 1)
```
2024-01-15 10:30:00 - INFO - 🚀 Iniciando aplicación...
2024-01-15 10:30:01 - INFO - ✅ Conectado a MongoDB
2024-01-15 10:30:01 - INFO - ✅ Aplicación lista
```

### Frontend (Terminal 2)
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- event compiled client and server successfully
```

## 📝 Comandos Útiles

### Backend
```bash
# Activar entorno virtual
cd backend
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Ejecutar backend
python main.py

# Ejecutar con recarga automática
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Ver documentación API
# Abre: http://localhost:8000/docs
```

### Frontend
```bash
# Ejecutar en desarrollo
npm run dev

# Compilar para producción
npm run build

# Ejecutar producción
npm start
```

## 🌐 URLs Importantes

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | http://localhost:3000 | Aplicación web |
| Backend | http://localhost:8000 | API REST |
| API Docs | http://localhost:8000/docs | Documentación Swagger |
| Health Check | http://localhost:8000/health | Estado del backend |

## 💡 Consejos

1. **Siempre inicia el backend ANTES que el frontend**
2. **Mantén ambas terminales abiertas** para ver logs en tiempo real
3. **Usa la documentación interactiva** en `/docs` para probar endpoints
4. **Revisa los logs** si algo no funciona
5. **Reinicia ambos servidores** después de cambiar archivos `.env`

## 🎯 Próximos Pasos

Una vez que todo funcione:

1. ✅ Prueba el login
2. ✅ Sube una factura de prueba
3. ✅ Verifica que se guarde en MongoDB
4. ✅ Consulta las facturas guardadas
5. ✅ Prueba la búsqueda por número de factura

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs de ambos servidores
2. Verifica que ambos estén corriendo
3. Revisa la documentación en `ARQUITECTURA_SEPARADA.md`
4. Prueba los endpoints con `curl` o desde `/docs`
