# 📄 Sistema de Extracción de Datos de Facturas

Sistema completo de extracción automática de información de facturas usando IA, con arquitectura separada en **Frontend (Next.js)** y **Backend (FastAPI)**.

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                      │
│                    http://localhost:3000                    │
│  - Interfaz de usuario                                      │
│  - Carga de archivos                                        │
│  - Visualización de facturas                                │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                        │
│                    http://localhost:8000                    │
│  - Extracción con OpenAI GPT-4o                            │
│  - Validación y lógica de negocio                          │
│  - Gestión de MongoDB                                       │
│  - Generación de URLs firmadas de S3                        │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
   ┌─────────┐    ┌──────────┐    ┌──────────┐
   │ MongoDB │    │ OpenAI   │    │  AWS S3  │
   │  Atlas  │    │   API    │    │ (Images) │
   └─────────┘    └──────────┘    └──────────┘
```

## 🚀 Características

- ✅ **Arquitectura separada**: Frontend y Backend independientes
- ✅ **Extracción automática** de datos usando OpenAI GPT-4o
- 📄 **Soporte para PDFs** (Assistants API)
- 🖼️ **Soporte para imágenes** (PNG, JPG, JPEG, WEBP) con Vision API
- 🗄️ **Almacenamiento en MongoDB Atlas**
- ☁️ **Imágenes en AWS S3** con URLs firmadas
- 🔍 **Detección de duplicados** por número de factura
- 🔐 **Sistema de autenticación** con SQLite
- 📊 **CRUD completo** de facturas
- 🎨 **Interfaz moderna** con TailwindCSS y modo oscuro
- 📥 **Drag & Drop** para cargar archivos

## 🛠️ Tecnologías

### Frontend
- **Framework**: Next.js 16, React 19, TypeScript 5
- **Estilos**: TailwindCSS con modo oscuro
- **HTTP Client**: Fetch API

### Backend
- **Framework**: FastAPI (Python)
- **IA**: OpenAI GPT-4o (Vision + Assistants API)
- **Base de Datos**: MongoDB Atlas con Motor (async)
- **Almacenamiento**: AWS S3 con boto3
- **Validación**: Pydantic
- **Auth**: SQLite local

## 📋 Requisitos Previos

### Frontend
- Node.js 18 o superior
- npm o yarn

### Backend
- Python 3.11 o superior
- pip
- Entorno virtual (venv)

### Servicios Externos
- API Key de OpenAI con acceso a GPT-4o
- Cuenta de MongoDB Atlas (gratuita)
- Cuenta de AWS con S3 (opcional, para imágenes)

## 🔧 Instalación y Configuración

### 1️⃣ Clonar el Repositorio

```bash
git clone https://github.com/A01092551/dde_v3.git
cd dde_v3
```

### 2️⃣ Configurar Backend (FastAPI)

```bash
# Navegar a la carpeta del backend
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
# Copia el template y edita con tus credenciales
cp env-template.txt .env
```

Edita `backend/.env` con tus credenciales:

```env
# OpenAI API Key
OPENAI_API_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# MongoDB Connection
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=MyApp
MONGODB_DB=facturas_db

# AWS S3 (opcional)
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=XXXXXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
AWS_S3_BUCKET_NAME=my-bucket-name

# Server Config
HOST=0.0.0.0
PORT=8000
FRONTEND_URL=http://localhost:3000
```

### 3️⃣ Configurar Frontend (Next.js)

```bash
# En otra terminal, desde la raíz del proyecto
npm install

# Configurar variables de entorno
# Copia el template y edita
cp env-frontend-template.txt .env.local
```

Edita `.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 4️⃣ Ejecutar el Sistema

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
```

Deberías ver:
```
🚀 Iniciando aplicación...
✅ Conectado a MongoDB
✅ Aplicación lista
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Deberías ver:
```
▲ Next.js 16.0.1
- Local:        http://localhost:3000
✓ Ready in 1.8s
```

### 5️⃣ Acceder a la Aplicación

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Documentación API**: http://localhost:8000/docs

## 📖 Uso

### 🗺️ Flujo de Navegación

```
┌─────────────────┐
│   Página Inicio │  http://localhost:3000
│   (Redirección) │
└────────┬────────┘
         │
         ├─── No autenticado ──→ Login (/login)
         │                         │
         │                         ↓
         └─── Autenticado ────→ Dashboard (/dashboard)
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ↓                             ↓
            Cargar Facturas              Ver Facturas Guardadas
            (/extraccion)                   (/facturas)
                    │                             │
                    ↓                             │
            1. Subir archivo                      │
            2. Extraer datos                      │
            3. Validar y guardar ─────────────────┘
                    │
                    ↓
            MongoDB Atlas
```

### Flujo Principal

1. **Acceder a la aplicación** en `http://localhost:3000`
2. **Iniciar sesión** (credenciales por defecto: `admin` / `admin`)
3. **Seleccionar una opción** en el menú principal:
   - 📤 **Cargar Facturas**: Extraer datos de nuevas facturas
   - 📋 **Ver Facturas Guardadas**: Consultar facturas en la base de datos

### Cargar y Procesar Facturas

1. Desde el menú principal, selecciona **"Cargar Facturas"**
2. **Arrastra o selecciona** una factura (PDF o imagen)
3. Haz clic en **"Extraer Datos"**
4. **Revisa los datos extraídos** en formato JSON
5. Haz clic en **"Validar y Guardar en BD"** para almacenar en MongoDB
6. **Verifica** el mensaje de confirmación

### Consultar Facturas

1. Desde el menú principal, selecciona **"Ver Facturas Guardadas"**
2. **Explora** todas las facturas almacenadas
3. **Busca** por número de factura usando la barra de búsqueda
4. **Visualiza** los detalles de cada factura

## 📁 Estructura del Proyecto

```
dde_v3/
├── backend/                       # Backend FastAPI
│   ├── config.py                  # Configuración y variables de entorno
│   ├── main.py                    # Punto de entrada de FastAPI
│   ├── requirements.txt           # Dependencias de Python
│   ├── .env                       # Variables de entorno (no incluido)
│   ├── env-template.txt           # Template de variables de entorno
│   ├── database/
│   │   ├── mongodb.py             # Conexión a MongoDB con Motor
│   │   └── sqlite.py              # Conexión a SQLite para usuarios
│   ├── models/
│   │   ├── invoice.py             # Modelos Pydantic de facturas
│   │   └── user.py                # Modelos Pydantic de usuarios
│   ├── routers/
│   │   ├── auth.py                # Endpoints de autenticación
│   │   └── invoices.py            # Endpoints de facturas (CRUD)
│   ├── services/
│   │   ├── openai_service.py      # Servicio de OpenAI
│   │   └── invoice_service.py     # Lógica de negocio de facturas
│   └── README.md                  # Documentación del backend
│
├── app/                           # Frontend Next.js
│   ├── login/
│   │   └── page.tsx               # Página de login
│   ├── dashboard/
│   │   └── page.tsx               # Dashboard principal
│   ├── extraccion/
│   │   └── page.tsx               # Página de extracción de facturas
│   ├── facturas/
│   │   └── page.tsx               # Página de gestión de facturas
│   ├── layout.tsx                 # Layout principal
│   └── page.tsx                   # Página de inicio
│
├── lib/
│   └── api-config.ts              # Configuración de URLs del backend
│
├── .env.local                     # Variables de entorno frontend (no incluido)
├── env-frontend-template.txt      # Template de variables de entorno
├── ARQUITECTURA_SEPARADA.md       # Documentación de arquitectura
├── GUIA_EJECUCION.md              # Guía de ejecución paso a paso
├── CONFIGURAR_S3.md               # Guía de configuración de S3
├── PRUEBAS_CURL.md                # Ejemplos de pruebas con curl
└── package.json                   # Dependencias del frontend
```

## 🔑 Campos Extraídos

La aplicación extrae los siguientes campos de las facturas:

- **numeroFactura**: Número de la factura
- **fecha**: Fecha de emisión
- **fechaVencimiento**: Fecha de vencimiento
- **proveedor**: Información del proveedor (nombre, RFC/NIT, dirección, teléfono)
- **cliente**: Información del cliente (nombre, RFC/NIT, dirección)
- **items**: Array de productos/servicios con:
  - descripcion
  - cantidad
  - precioUnitario
  - total
- **subtotal**: Subtotal antes de impuestos
- **iva**: Monto del IVA u otros impuestos
- **total**: Total a pagar
- **moneda**: Moneda utilizada
- **formaPago**: Forma de pago
- **metodoPago**: Método de pago
- **usoCFDI**: Uso del CFDI (facturas mexicanas)
- **observaciones**: Notas adicionales

## 🧪 Dataset de Prueba

El proyecto incluye un notebook Jupyter para descargar un dataset de facturas de ejemplo desde Hugging Face:

```bash
# Navegar a la carpeta de notebooks
cd notebooks

# Ejecutar el notebook
jupyter notebook descargar_facturas.ipynb
```

## 🚀 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio de GitHub con Vercel
2. Configura la variable de entorno `OPENAI_API_KEY`
3. Despliega automáticamente

### Otros Servicios

El proyecto es compatible con cualquier servicio que soporte Next.js 16.

## 📝 Notas Importantes

- ⚠️ **No subas tu `.env.local`** al repositorio (ya está en `.gitignore`)
- 💰 El uso de la API de OpenAI tiene costos asociados
- 🔒 Implementa autenticación real para producción
- 📊 El dataset de facturas no se incluye en el repositorio por su tamaño

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👨‍💻 Autor

**A01092551**

## 🙏 Agradecimientos

- OpenAI por la API de GPT-4o
- Next.js por el framework
- Hugging Face por el dataset de facturas
