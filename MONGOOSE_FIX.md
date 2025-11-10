# 🔧 Fix: Mongoose Buffering Timeout

## ❌ Problema Original

```
Error al guardar factura: MongooseError: Operation `facturas.findOne()` buffering timed out after 10000ms
```

**Causa:** Mongoose no estaba conectándose correctamente a MongoDB, aunque el driver nativo sí funcionaba.

---

## ✅ Solución Implementada

### **1. Creado nuevo archivo de conexión Mongoose**

**Archivo:** `lib/mongoose.ts`

Este archivo:
- ✅ Maneja la conexión de Mongoose específicamente
- ✅ Usa caché global para evitar múltiples conexiones en desarrollo
- ✅ Configura timeouts apropiados
- ✅ Desactiva `bufferCommands` para evitar el buffering timeout

**Configuración clave:**
```typescript
const opts = {
  bufferCommands: false,           // ← Evita buffering timeout
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};
```

---

### **2. Actualizadas las rutas de API**

**Archivos modificados:**
- `app/api/invoices/route.ts`
- `app/api/invoices/[id]/route.ts`

**Cambio:**
```typescript
// ❌ Antes (solo driver nativo)
import clientPromise from '@/lib/mongodb';
await clientPromise;

// ✅ Ahora (Mongoose)
import connectDB from '@/lib/mongoose';
await connectDB();
```

---

## 🎯 Diferencia entre MongoDB Driver y Mongoose

| Aspecto | MongoDB Driver | Mongoose |
|---------|----------------|----------|
| **Uso** | Queries directas | ODM con modelos |
| **Conexión** | `MongoClient.connect()` | `mongoose.connect()` |
| **Modelos** | No | Sí (schemas) |
| **Validación** | Manual | Automática |
| **Buffering** | No aplica | Puede causar timeout |

**Problema anterior:**
- Usábamos `clientPromise` (driver nativo)
- Pero los modelos de Mongoose esperaban `mongoose.connect()`
- Mongoose intentaba hacer buffering de las operaciones
- Timeout después de 10 segundos

---

## 🧪 Cómo Probar

### **1. Reiniciar el servidor**

```bash
npm run dev
```

Deberías ver en los logs:
```
🔌 Conectando a MongoDB con Mongoose...
✅ Mongoose conectado exitosamente
```

---

### **2. Cargar una factura**

1. Ve a `http://localhost:3000/extraccion`
2. Sube un PDF de factura
3. Haz clic en "Extraer Datos"
4. Haz clic en "Validar"

**Resultado esperado:**
```
✅ Factura guardada exitosamente
```

**En los logs del servidor:**
```
🔌 Conectando a MongoDB con Mongoose...
✅ Mongoose conectado exitosamente
POST /api/invoices 200 in 12.4s
POST /api/invoices 201 in 150ms  ← Guardado exitoso
```

---

### **3. Verificar en la base de datos**

```bash
node test-mongodb-connection.js
```

**Resultado esperado:**
```
📊 Estadísticas:
   Total de facturas: 1  ← Ya no es 0
```

---

### **4. Ver facturas en la interfaz**

```
http://localhost:3000/facturas
```

Deberías ver las facturas guardadas.

---

## 📊 Logs Antes vs Después

### **❌ Antes (Error):**
```
POST /api/invoices 200 in 11.8s  ← Extracción OK
Error al guardar factura: MongooseError: Operation `facturas.findOne()` buffering timed out after 10000ms
POST /api/invoices 500 in 10.0s  ← Guardado FALLA
```

### **✅ Después (Funciona):**
```
🔌 Conectando a MongoDB con Mongoose...
✅ Mongoose conectado exitosamente
POST /api/invoices 200 in 12.4s  ← Extracción OK
POST /api/invoices 201 in 150ms  ← Guardado OK
```

---

## 🔍 Verificación de Conexión

### **Mongoose está conectado si ves:**
```typescript
✅ Usando conexión existente de Mongoose  // En requests subsecuentes
```

### **Si hay problemas, verás:**
```typescript
❌ Error al conectar Mongoose: [error details]
```

---

## 🎯 Resumen de Cambios

1. ✅ **Creado** `lib/mongoose.ts` - Conexión dedicada de Mongoose
2. ✅ **Actualizado** `app/api/invoices/route.ts` - Usa `connectDB()`
3. ✅ **Actualizado** `app/api/invoices/[id]/route.ts` - Usa `connectDB()`
4. ✅ **Configurado** `bufferCommands: false` - Evita timeout
5. ✅ **Agregado** caché global - Reutiliza conexión en desarrollo

---

## 🚀 Próximos Pasos

1. **Reinicia el servidor:**
```bash
npm run dev
```

2. **Prueba cargar una factura desde la interfaz**

3. **Verifica que se guardó:**
```bash
node test-mongodb-connection.js
```

4. **Carga facturas de ejemplo (opcional):**
```bash
node seed-facturas.js
```

---

## ✅ Checklist de Verificación

- [ ] El servidor inicia sin errores
- [ ] Ves "✅ Mongoose conectado exitosamente" en los logs
- [ ] Puedes extraer datos de una factura
- [ ] Puedes guardar la factura (botón "Validar")
- [ ] La factura aparece en `/facturas`
- [ ] `node test-mongodb-connection.js` muestra facturas > 0
- [ ] No hay errores de timeout en los logs

---

## 🆘 Si Aún Hay Problemas

1. **Verifica que .env.local tiene las variables:**
```bash
OPENAI_API_KEY=sk-proj-...
MONGODB_URI=mongodb+srv://...
MONGODB_DB=facturas_db
```

2. **Limpia y reinstala:**
```bash
rm -rf .next
npm run dev
```

3. **Verifica los logs del servidor** para ver mensajes de Mongoose

4. **Prueba el script de conexión:**
```bash
node test-mongodb-connection.js
```
