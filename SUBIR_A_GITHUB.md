# 📤 Guía para Subir el Proyecto a GitHub

## 🔐 Verificación de Seguridad

Antes de subir, **VERIFICA** que estos archivos NO se suban (ya están en `.gitignore`):

- ❌ `backend/.env` (contiene credenciales)
- ❌ `.env.local` (contiene credenciales)
- ❌ `backend/venv/` (entorno virtual de Python)
- ❌ `node_modules/` (dependencias de Node.js)
- ❌ `backend/__pycache__/` (archivos compilados de Python)
- ❌ `backend/*.db` (base de datos SQLite)

## 📋 Pasos para Subir

### 1️⃣ Inicializar Git (si no está inicializado)

```bash
# Desde la raíz del proyecto
cd "c:\Users\Anuar\Documents\Maestria Inteligencia artificial\Diseno de sistemas\dde_v4"

# Inicializar repositorio (solo si es nuevo)
git init
```

### 2️⃣ Configurar el Repositorio Remoto

```bash
# Agregar el repositorio remoto
git remote add origin https://github.com/A01092551/dde_v3.git

# Verificar que se agregó correctamente
git remote -v
```

### 3️⃣ Verificar Archivos a Subir

```bash
# Ver qué archivos se van a subir
git status

# Ver archivos ignorados (para verificar que .env está ignorado)
git status --ignored
```

**IMPORTANTE**: Verifica que `backend/.env` y `.env.local` aparezcan en la lista de archivos ignorados.

### 4️⃣ Agregar Archivos al Staging

```bash
# Agregar todos los archivos (excepto los ignorados)
git add .

# Verificar qué se agregó
git status
```

### 5️⃣ Hacer Commit

```bash
# Crear commit con mensaje descriptivo
git commit -m "feat: Refactor proyecto con arquitectura separada Frontend (Next.js) y Backend (FastAPI)

- Separación completa de frontend y backend
- Backend FastAPI con endpoints REST
- Frontend Next.js consumiendo API
- Integración con MongoDB Atlas
- Integración con AWS S3 para imágenes
- Sistema de autenticación
- CRUD completo de facturas
- Documentación completa"
```

### 6️⃣ Subir a GitHub

```bash
# Si es la primera vez (crear rama main)
git branch -M main

# Subir al repositorio
git push -u origin main
```

Si el repositorio ya existe y tiene contenido, usa:

```bash
# Forzar push (solo si estás seguro)
git push -u origin main --force
```

## 🔄 Actualizaciones Futuras

Para subir cambios posteriores:

```bash
# 1. Ver cambios
git status

# 2. Agregar cambios
git add .

# 3. Hacer commit
git commit -m "Descripción de los cambios"

# 4. Subir
git push
```

## ⚠️ Solución de Problemas

### Error: "remote origin already exists"

```bash
# Eliminar el remote existente
git remote remove origin

# Agregar nuevamente
git remote add origin https://github.com/A01092551/dde_v3.git
```

### Error: "Updates were rejected"

```bash
# Hacer pull primero
git pull origin main --allow-unrelated-histories

# Resolver conflictos si los hay
# Luego hacer push
git push origin main
```

### Verificar que .env NO se subió

```bash
# Buscar .env en el repositorio remoto
git ls-files | grep ".env"

# No debería mostrar backend/.env ni .env.local
```

Si accidentalmente subiste archivos sensibles:

```bash
# Eliminar del historial (PELIGROSO - úsalo con cuidado)
git rm --cached backend/.env
git rm --cached .env.local
git commit -m "Remove sensitive files"
git push
```

## 📝 Checklist Final

Antes de hacer push, verifica:

- [ ] `.gitignore` está actualizado
- [ ] `backend/.env` NO está en staging
- [ ] `.env.local` NO está en staging
- [ ] `backend/venv/` NO está en staging
- [ ] `node_modules/` NO está en staging
- [ ] README.md está actualizado
- [ ] Documentación está completa
- [ ] Los templates de `.env` SÍ están incluidos

## 🎉 Verificación Post-Push

Después de subir:

1. Ve a https://github.com/A01092551/dde_v3
2. Verifica que los archivos estén correctos
3. Verifica que NO haya archivos sensibles
4. Lee el README en GitHub para verificar que se vea bien

## 📚 Archivos que SÍ deben estar en GitHub

✅ Código fuente (`.py`, `.ts`, `.tsx`, `.js`)
✅ Archivos de configuración (`package.json`, `requirements.txt`, `next.config.ts`)
✅ Templates de variables de entorno (`env-template.txt`, `env-frontend-template.txt`)
✅ Documentación (`.md`)
✅ `.gitignore`
✅ `README.md`

## 🚫 Archivos que NO deben estar en GitHub

❌ Variables de entorno reales (`.env`, `.env.local`)
❌ Entornos virtuales (`venv/`, `node_modules/`)
❌ Archivos compilados (`__pycache__/`, `.next/`)
❌ Bases de datos locales (`*.db`, `*.sqlite`)
❌ Credenciales de AWS, OpenAI, MongoDB
❌ Archivos de configuración del IDE (`.vscode/`, `.idea/`)
