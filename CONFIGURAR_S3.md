# 🖼️ Configuración de AWS S3 para Imágenes de Facturas

## 📋 Información del Bucket

Según los datos en MongoDB, tu bucket de S3 es:
- **Bucket**: `data-extractor-v1`
- **Región**: `us-east-2` (Ohio)
- **URL Base**: `https://data-extractor-v1.s3.us-east-2.amazonaws.com/`

## 🔧 Paso 1: Agregar Credenciales en `backend/.env`

Edita el archivo `backend/.env` y agrega estas líneas:

```env
# AWS S3 Configuration
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=tu-access-key-aqui
AWS_SECRET_ACCESS_KEY=tu-secret-key-aqui
AWS_S3_BUCKET_NAME=data-extractor-v1
```

### 🔑 Obtener las Credenciales de AWS

1. **Inicia sesión en AWS Console**: https://console.aws.amazon.com/
2. **Ve a IAM** (Identity and Access Management)
3. **Crea un nuevo usuario** (o usa uno existente):
   - Nombre: `invoice-extractor-user`
   - Tipo de acceso: **Acceso programático**
4. **Asigna permisos**:
   - Adjunta la política: `AmazonS3FullAccess` (o crea una política personalizada)
5. **Guarda las credenciales**:
   - `AWS_ACCESS_KEY_ID`: Algo como `AKIAIOSFODNN7EXAMPLE`
   - `AWS_SECRET_ACCESS_KEY`: Algo como `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

### 🔒 Política de S3 Personalizada (Recomendada)

Si quieres más seguridad, crea una política personalizada con estos permisos:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::data-extractor-v1/invoices/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::data-extractor-v1"
        }
    ]
}
```

## 🚀 Paso 2: Reiniciar el Backend

Después de agregar las credenciales:

```bash
# Detén el backend (Ctrl+C)
# Luego ejecuta:
python main.py
```

Deberías ver:
```
🚀 Iniciando aplicación...
✅ Conectado a MongoDB
✅ Aplicación lista
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## ✅ Paso 3: Verificar que Funciona

### Opción 1: Desde la Interfaz Web

1. Ve a http://localhost:3000/facturas
2. Haz clic en una factura para ver detalles
3. La imagen debería cargarse correctamente

### Opción 2: Probar con curl

```bash
# Probar endpoint de imagen
curl "http://localhost:8000/api/invoices/image?key=invoices/1762938242-factura_3.png"
```

**Respuesta esperada:**
```json
{
  "url": "https://data-extractor-v1.s3.us-east-2.amazonaws.com/invoices/1762938242-factura_3.png?..."
}
```

## 🔍 Verificar Logs del Backend

Cuando abras una factura, deberías ver en los logs:

```
🖼️ Generando URL firmada para: invoices/1762938242-factura_3.png
✅ URL firmada generada para: invoices/1762938242-factura_3.png
```

## ⚠️ Solución de Problemas

### Error: "S3 no está configurado"

**Causa:** Las variables de entorno no están configuradas.

**Solución:**
1. Verifica que `backend/.env` tenga las 4 variables de AWS
2. Reinicia el backend después de editar `.env`

### Error: "Access Denied"

**Causa:** Las credenciales no tienen permisos suficientes.

**Solución:**
1. Verifica que el usuario IAM tenga permisos de S3
2. Verifica que el bucket `data-extractor-v1` exista
3. Verifica que la región sea `us-east-2`

### Error: "The specified bucket does not exist"

**Causa:** El nombre del bucket es incorrecto o no existe.

**Solución:**
1. Ve a AWS S3 Console
2. Verifica que el bucket `data-extractor-v1` exista
3. Si no existe, créalo en la región `us-east-2`

### Las imágenes no cargan

**Causa:** El bucket puede tener configuración de CORS incorrecta.

**Solución:**
1. Ve a AWS S3 Console
2. Selecciona el bucket `data-extractor-v1`
3. Ve a **Permissions** → **CORS configuration**
4. Agrega esta configuración:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

## 📝 Notas Importantes

1. **URLs Firmadas**: Las URLs generadas expiran después de 1 hora (3600 segundos)
2. **Seguridad**: Nunca compartas tus credenciales de AWS
3. **Costo**: S3 cobra por almacenamiento y transferencia de datos (muy bajo para uso normal)
4. **Facturas Antiguas**: Las 4 facturas existentes ya tienen imágenes en S3
5. **Facturas Nuevas**: Se guardarán automáticamente en S3 cuando configures las credenciales

## 🎯 Resultado Final

Una vez configurado correctamente:

✅ Las facturas existentes mostrarán sus imágenes  
✅ Las nuevas facturas guardarán sus imágenes en S3  
✅ Las URLs de imágenes se generarán dinámicamente  
✅ El sistema funcionará completamente separado (Frontend + Backend + S3)  

## 💡 Alternativa Sin S3

Si no quieres usar S3 por ahora:

1. Las facturas seguirán funcionando normalmente
2. Solo no se mostrarán las imágenes
3. Los datos extraídos estarán disponibles
4. Puedes configurar S3 más tarde sin problemas
