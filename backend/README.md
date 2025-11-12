# Backend FastAPI - Sistema de Extracción de Facturas

API REST desarrollada con FastAPI para extraer datos de facturas usando OpenAI GPT-4o.

## 🚀 Instalación

### 1. Crear entorno virtual de Python

```bash
# Navegar a la carpeta backend
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En Linux/Mac:
source venv/bin/activate
```

### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `backend/` basado en `env-template.txt`:

```env
OPENAI_API_KEY=tu-api-key-aqui
MONGODB_URI=mongodb+srv://usuario:<password>@cluster.mongodb.net/
MONGODB_DB=facturas_db
FRONTEND_URL=http://localhost:3000
```

## 🏃 Ejecutar el servidor

```bash
# Asegúrate de estar en la carpeta backend/ con el entorno virtual activado
python main.py

# O usando uvicorn directamente:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

El servidor estará disponible en:
- **API**: http://localhost:8000
- **Documentación Swagger**: http://localhost:8000/docs
- **Documentación ReDoc**: http://localhost:8000/redoc

## 📡 Endpoints Disponibles

### Autenticación

#### `POST /api/auth/login`
Login de usuario

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### Facturas

#### `POST /api/invoices/extract`
Extraer datos de una factura (PDF o imagen)

**Request:** `multipart/form-data`
- `file`: Archivo PDF o imagen

**Response:**
```json
{
  "numeroFactura": "F-001",
  "fecha": "2024-01-15",
  "total": 1000.00,
  "metadata": {
    "fileName": "factura.pdf",
    "processedAt": "2024-01-15T10:30:00",
    "model": "gpt-4o"
  }
}
```

#### `POST /api/invoices/validate`
Validar y guardar factura en MongoDB

**Request:**
```json
{
  "numeroFactura": "F-001",
  "fecha": "2024-01-15",
  "total": 1000.00,
  "metadata": {
    "fileName": "factura.pdf",
    "processedAt": "2024-01-15T10:30:00"
  }
}
```

**Response:**
```json
{
  "message": "Factura validada y guardada exitosamente",
  "id": "507f1f77bcf86cd799439011",
  "numeroFactura": "F-001"
}
```

#### `GET /api/invoices`
Listar facturas con paginación

**Query Parameters:**
- `skip`: Número de registros a saltar (default: 0)
- `limit`: Número de registros a devolver (default: 50)
- `numero`: Filtrar por número de factura (opcional)

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "skip": 0,
    "limit": 50,
    "hasMore": true
  }
}
```

#### `GET /api/invoices/{invoice_id}`
Obtener una factura por ID

#### `DELETE /api/invoices/{invoice_id}`
Eliminar una factura

## 🧪 Probar con curl

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### Extraer factura
```bash
curl -X POST http://localhost:8000/api/invoices/extract \
  -F "file=@factura.pdf"
```

### Listar facturas
```bash
curl http://localhost:8000/api/invoices?limit=10
```

## 📁 Estructura del Proyecto

```
backend/
├── main.py                 # Aplicación principal FastAPI
├── config.py              # Configuración y variables de entorno
├── requirements.txt       # Dependencias de Python
├── models/               # Modelos Pydantic
│   ├── invoice.py
│   └── user.py
├── routers/              # Endpoints de la API
│   ├── invoices.py
│   └── auth.py
├── services/             # Lógica de negocio
│   ├── openai_service.py
│   └── invoice_service.py
├── database/             # Conexiones a bases de datos
│   ├── mongodb.py
│   └── sqlite.py
└── .env                  # Variables de entorno (no incluido)
```

## 🔧 Tecnologías

- **FastAPI** - Framework web moderno y rápido
- **Uvicorn** - Servidor ASGI
- **OpenAI** - API de GPT-4o para extracción de datos
- **Motor** - Driver asíncrono de MongoDB
- **Pydantic** - Validación de datos
- **Python-multipart** - Manejo de archivos

## 📝 Notas

- El backend corre en el puerto **8000** por defecto
- El frontend (Next.js) debe correr en el puerto **3000**
- CORS está configurado para permitir comunicación entre ambos
- La documentación interactiva está disponible en `/docs`
