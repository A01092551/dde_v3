# 📄 Sistema de Extracción de Datos de Facturas

Aplicación web desarrollada con Next.js 16 y OpenAI GPT-4o para extraer automáticamente información estructurada de facturas en formato PDF o imagen.

## 🚀 Características

- ✅ **Extracción automática de datos** de facturas usando OpenAI GPT-4o
- 📄 **Soporte para PDFs** (usando Assistants API)
- 🖼️ **Soporte para imágenes** (PNG, JPG, JPEG, WEBP) usando Vision API
- 🔐 **Sistema de autenticación** simple
- 📊 **Visualización de datos** extraídos en formato JSON
- 🎨 **Interfaz moderna** con TailwindCSS y modo oscuro
- 📥 **Drag & Drop** para cargar archivos

## 🛠️ Tecnologías

- **Frontend**: Next.js 16, React 19, TypeScript 5, TailwindCSS
- **IA**: OpenAI GPT-4o (Vision API + Assistants API)
- **Gestión de Estado**: React Hooks
- **Estilos**: TailwindCSS con modo oscuro

## 📋 Requisitos Previos

- Node.js 18 o superior
- npm o yarn
- API Key de OpenAI con acceso a GPT-4o

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
OPENAI_API_KEY=tu-api-key-aqui
```

> 💡 Puedes obtener tu API Key en: https://platform.openai.com/api-keys

4. **Ejecutar el servidor de desarrollo**
```bash
npm run dev
```

5. **Abrir en el navegador**

Ve a [http://localhost:3000](http://localhost:3000)

## 📖 Uso

1. **Iniciar sesión** en `/login` (credenciales por defecto: admin/admin)
2. **Ir a la página de extracción** en `/extraccion`
3. **Cargar una factura** (PDF o imagen)
4. **Hacer clic en "Extraer Datos"**
5. **Ver los resultados** en formato JSON estructurado

## 📁 Estructura del Proyecto

```
dde_v2/
├── app/
│   ├── api/
│   │   └── extract-invoice/
│   │       └── route.ts          # API endpoint para extracción
│   ├── login/
│   │   └── page.tsx              # Página de login
│   ├── extraccion/
│   │   └── page.tsx              # Página de extracción
│   ├── layout.tsx                # Layout principal
│   └── page.tsx                  # Página de inicio
├── notebooks/
│   └── descargar_facturas.ipynb  # Notebook para descargar dataset
├── public/                        # Archivos estáticos
├── .env.local                     # Variables de entorno (no incluido)
├── env-template.txt               # Plantilla de variables de entorno
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
