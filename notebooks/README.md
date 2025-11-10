# 📓 Notebooks - Sistema de Extracción de Facturas

## 📄 descargar_facturas.ipynb

Este notebook descarga un dataset de facturas desde Hugging Face para probar el sistema.

### 🚀 Cómo Usar

1. **Abre el notebook** en Jupyter, VS Code, o tu IDE favorito

2. **Ejecuta las celdas en orden**:
   - Celda 1: Instala las dependencias necesarias
   - Celda 2: Descarga el dataset desde Hugging Face
   - Celda 3: Crea el directorio para las facturas
   - Celda 4: Guarda facturas de ejemplo como imágenes
   - Celda 5: Visualiza una factura de ejemplo

3. **Las facturas se guardarán en**: `../facturas_dataset/`

### 📦 Dataset Utilizado

- **Nombre**: `katanaml-org/invoices-donut-data-v1`
- **Fuente**: [Hugging Face](https://huggingface.co/datasets/katanaml-org/invoices-donut-data-v1)
- **Contenido**: 
  - Imágenes de facturas reales
  - Ground truth (datos estructurados) de cada factura
  - Splits: train, validation, test

### 🔧 Solución de Problemas

#### Error: "No module named 'huggingface_hub'"
**Solución**: Ejecuta la primera celda del notebook que instala las dependencias:
```python
%pip install huggingface_hub datasets pillow matplotlib pandas
```

#### Error de descarga lenta
**Solución**: El dataset puede tardar unos minutos en descargarse dependiendo de tu conexión. Ten paciencia.

#### Error de memoria
**Solución**: Si tienes poca RAM, reduce el número de facturas a guardar modificando:
```python
num_samples = 5  # En lugar de 10
```

### 📊 Estructura de los Datos

Cada factura descargada incluye:

1. **Imagen** (`factura_N.png`): La imagen de la factura
2. **Metadata** (`factura_N_metadata.json`): Información estructurada que incluye:
   - Ground truth (datos reales de la factura)
   - Nombre del archivo

### 🎯 Uso con el Sistema de Extracción

Una vez descargadas las facturas:

1. Inicia el servidor: `npm run dev`
2. Ve a: `http://localhost:3000/login`
3. Inicia sesión
4. Ve a: `http://localhost:3000/extraccion`
5. Carga una de las facturas descargadas desde `facturas_dataset/`
6. Compara los resultados de OpenAI con el ground truth en el archivo JSON

### 📝 Notas

- Las facturas son imágenes PNG, no PDFs
- Si necesitas PDFs, puedes convertirlas usando herramientas como `img2pdf`
- El ground truth te permite validar la precisión de la extracción de OpenAI
