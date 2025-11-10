# 📄 Sistema de Extracción de Datos de Facturas

Aplicación web desarrollada con Next.js 16 y OpenAI GPT-4o para extraer automáticamente información estructurada de facturas en formato PDF o imagen.

## 🚀 Características

- ✅ **Extracción automática de datos** de facturas usando OpenAI GPT-4o
- 📄 **Soporte para PDFs** (usando Assistants API)
- 🖼️ **Soporte para imágenes** (PNG, JPG, JPEG, WEBP) usando Vision API
- 🗄️ **Validación y almacenamiento** en MongoDB Atlas
- 🔍 **Detección de duplicados** por número de factura
- 🔐 **Sistema de autenticación** simple
- 📊 **Visualización de datos** extraídos en formato JSON
- 🎨 **Interfaz moderna** con TailwindCSS y modo oscuro
- 📥 **Drag & Drop** para cargar archivos

## 🛠️ Tecnologías

- **Frontend**: Next.js 16, React 19, TypeScript 5, TailwindCSS
- **IA**: OpenAI GPT-4o (Vision API + Assistants API)
- **Base de Datos**: MongoDB Atlas con Mongoose
- **Gestión de Estado**: React Hooks
- **Estilos**: TailwindCSS con modo oscuro

## 📋 Requisitos Previos

- Node.js 18 o superior
- npm o yarn
- API Key de OpenAI con acceso a GPT-4o
- Cuenta de MongoDB Atlas (gratuita)

## 🔧 Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/A01092551/dde_v2.git
cd dde_v2
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# OpenAI API Key
OPENAI_API_KEY=tu-api-key-aqui

# MongoDB Connection
MONGODB_URI=mongodb+srv://usuario:<password>@cluster.mongodb.net/?appName=MyApp
MONGODB_DB=facturas_db
```

> 💡 **OpenAI**: Obtén tu API Key en https://platform.openai.com/api-keys
> 
> 💡 **MongoDB**: Obtén tu connection string en MongoDB Atlas. Ver [MONGODB_SETUP.md](./MONGODB_SETUP.md) para más detalles.

4. **Ejecutar el servidor de desarrollo**
```bash
npm run dev
```

5. **Abrir en el navegador**

Ve a [http://localhost:3000](http://localhost:3000)

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
dde_v2/
├── app/
│   ├── api/
│   │   ├── extract-invoice/
│   │   │   └── route.ts          # API endpoint para extracción
│   │   └── validate-invoice/
│   │       └── route.ts          # API endpoint para validación y guardado
│   ├── login/
│   │   └── page.tsx              # Página de login
│   ├── dashboard/
│   │   └── page.tsx              # Menú principal (después del login)
│   ├── extraccion/
│   │   └── page.tsx              # Página de extracción de facturas
│   ├── facturas/
│   │   └── page.tsx              # Página de consulta de facturas
│   ├── layout.tsx                # Layout principal
│   └── page.tsx                  # Página de inicio (redirección)
├── lib/
│   ├── mongodb.ts                # Configuración de MongoDB
│   └── models/
│       └── Factura.ts            # Modelo de Mongoose para facturas
├── notebooks/
│   └── descargar_facturas.ipynb  # Notebook para descargar dataset
├── public/                        # Archivos estáticos
├── .env.local                     # Variables de entorno (no incluido)
├── env-template.txt               # Plantilla de variables de entorno
├── MONGODB_SETUP.md               # Guía de configuración de MongoDB
├── API_EXAMPLES.md                # Ejemplos de uso de API endpoints
└── package.json                   # Dependencias del proyecto
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
