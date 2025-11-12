# 🏗️ Arquitectura Separada - Frontend y Backend

Este proyecto ha sido dividido en dos aplicaciones independientes que se comunican vía API REST.

## 📊 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Navegador)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
┌───────────────────┐           ┌──────────────────┐
│   FRONTEND        │           │   BACKEND        │
│   Next.js         │◄─────────►│   FastAPI        │
│   Puerto: 3000    │   REST    │   Puerto: 8000   │
│                   │   API     │                  │
│ - UI/UX           │           │ - Lógica negocio │
│ - Páginas React   │           │ - OpenAI API     │
│ - Validación      │           │ - MongoDB        │
│ - Navegación      │           │ - SQLite         │
└───────────────────┘           └──────────────────┘
                                         │
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
            ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
            │   MongoDB    │    │   OpenAI     │    │   SQLite     │
            │   (Facturas) │    │   GPT-4o     │    │   (Usuarios) │
            └──────────────┘    └──────────────┘    └──────────────┘
```

## 🚀 Cómo Ejecutar

### Terminal 1: Backend (FastAPI)

```bash
# Navegar a la carpeta backend
cd backend

# Crear y activar entorno virtual (primera vez)
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Instalar dependencias (primera vez)
pip install -r requirements.txt

# Crear archivo .env con tus credenciales
# (Copia env-template.txt como .env y edita los valores)

# Ejecutar el servidor
python main.py
```

**Backend disponible en:** http://localhost:8000
**Documentación API:** http://localhost:8000/docs

### Terminal 2: Frontend (Next.js)

```bash
# Navegar a la raíz del proyecto
cd dde_v4

# Instalar dependencias (si no lo has hecho)
npm install

# Ejecutar el servidor de desarrollo
npm run dev
```

**Frontend disponible en:** http://localhost:3000

## 🔄 Flujo de Comunicación

### 1. Login
```
Usuario → Frontend → Backend (/api/auth/login) → SQLite → Backend → Frontend
```

### 2. Extracción de Factura
```
Usuario → Frontend → Backend (/api/invoices/extract) → OpenAI → Backend → Frontend
```

### 3. Guardar Factura
```
Usuario → Frontend → Backend (/api/invoices/validate) → MongoDB → Backend → Frontend
```

### 4. Listar Facturas
```
Usuario → Frontend → Backend (/api/invoices) → MongoDB → Backend → Frontend
```

## 📡 Endpoints del Backend

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Autenticación de usuario |
| POST | `/api/invoices/extract` | Extraer datos de factura |
| POST | `/api/invoices/validate` | Guardar factura en BD |
| GET | `/api/invoices` | Listar facturas |
| GET | `/api/invoices/{id}` | Obtener factura por ID |
| DELETE | `/api/invoices/{id}` | Eliminar factura |

## 🧪 Probar con curl

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### Extraer Factura
```bash
curl -X POST http://localhost:8000/api/invoices/extract \
  -F "file=@ruta/a/factura.pdf"
```

### Listar Facturas
```bash
curl http://localhost:8000/api/invoices?limit=10
```

### Obtener Factura por ID
```bash
curl http://localhost:8000/api/invoices/507f1f77bcf86cd799439011
```

## 🔧 Configuración

### Backend (.env en carpeta backend/)
```env
OPENAI_API_KEY=tu-api-key
MONGODB_URI=mongodb+srv://...
MONGODB_DB=facturas_db
FRONTEND_URL=http://localhost:3000
HOST=0.0.0.0
PORT=8000
```

### Frontend (.env.local en raíz del proyecto)
```env
# Las APIs ahora apuntan al backend FastAPI
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📦 Dependencias

### Backend (Python)
- FastAPI
- Uvicorn
- OpenAI
- Motor (MongoDB async)
- Pydantic
- Python-multipart

### Frontend (Node.js)
- Next.js 16
- React 19
- TypeScript
- TailwindCSS

## ✅ Ventajas de esta Arquitectura

1. **Separación de responsabilidades** - Frontend y backend independientes
2. **Escalabilidad** - Cada parte puede escalar por separado
3. **Tecnologías especializadas** - Python para IA, JavaScript para UI
4. **Desarrollo paralelo** - Equipos pueden trabajar independientemente
5. **Testing más fácil** - Cada parte se prueba por separado
6. **Despliegue flexible** - Frontend y backend en diferentes servidores

## 🔍 Debugging

### Ver logs del backend
El backend muestra logs detallados en la terminal:
```
2024-01-15 10:30:00 - INFO - 🚀 Iniciando aplicación...
2024-01-15 10:30:01 - INFO - ✅ Conectado a MongoDB
2024-01-15 10:30:01 - INFO - ✅ Aplicación lista
```

### Ver documentación interactiva
Visita http://localhost:8000/docs para probar los endpoints directamente desde el navegador.

## 📝 Notas Importantes

- **Ambos servidores deben estar corriendo** para que la aplicación funcione
- El backend debe iniciarse **antes** que el frontend
- CORS está configurado para permitir comunicación entre puertos 3000 y 8000
- Las credenciales de API deben estar en ambos archivos `.env`
