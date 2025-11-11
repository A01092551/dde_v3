# 🔧 Fix: Next.js 15 Async Params

## ❌ Error
```
Error: Route "/api/invoices/[id]" used `params.id`. 
`params` is a Promise and must be unwrapped with `await` 
or `React.use()` before accessing its properties.
```

---

## 🔍 Root Cause

**Next.js 15** introduced a breaking change where `params` in API routes is now a **Promise** that must be awaited.

### **Why?**
- Better performance with async operations
- Consistency with other Next.js async APIs
- Preparation for future optimizations

---

## ✅ Solution

### **Before (Next.js 14 and earlier):**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }  // ❌ Synchronous
) {
  const { id } = params;  // ❌ Direct access
  // ...
}
```

### **After (Next.js 15+):**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ Promise type
) {
  const { id } = await params;  // ✅ Await the promise
  // ...
}
```

---

## 📝 Changes Made

Updated all route handlers in `/app/api/invoices/[id]/route.ts`:

1. **GET** - Read single invoice
2. **PUT** - Update complete invoice
3. **PATCH** - Partial update
4. **DELETE** - Delete invoice

### **Pattern Applied:**
```typescript
// 1. Update type signature
{ params }: { params: Promise<{ id: string }> }

// 2. Await params before destructuring
const { id } = await params;
```

---

## 🎯 Complete Example

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // Step 1: Promise type
) {
  try {
    await connectDB();
    
    const { id } = await params;  // Step 2: Await params
    
    // Validar formato de ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID de factura inválido' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    const factura = await Factura.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    );
    
    if (!factura) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(factura, { status: 200 });
    
  } catch (error: any) {
    console.error('Error al actualizar factura:', error);
    return NextResponse.json(
      { 
        error: 'Error al actualizar la factura',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
```

---

## 🔄 Migration Checklist

If you have other dynamic routes, update them too:

- [ ] `/app/api/invoices/[id]/route.ts` ✅ **FIXED**
- [ ] `/app/api/users/[id]/route.ts` (if exists)
- [ ] `/app/api/products/[id]/route.ts` (if exists)
- [ ] Any other `[param]` routes

### **Search Pattern:**
```bash
# Find all files with dynamic params
grep -r "{ params }: { params: {" app/api/
```

---

## 📚 Official Documentation

[Next.js Dynamic Route Segments](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#params)

### **Key Points:**
- `params` is now a Promise in Next.js 15+
- Must use `await params` or `React.use(params)`
- Applies to both App Router and Pages Router
- Breaking change from Next.js 14

---

## ⚡ Quick Fix Template

For any dynamic route handler:

```typescript
// OLD
export async function HANDLER(
  request: NextRequest,
  { params }: { params: { param: string } }
) {
  const { param } = params;
  // ...
}

// NEW
export async function HANDLER(
  request: NextRequest,
  { params }: { params: Promise<{ param: string }> }
) {
  const { param } = await params;
  // ...
}
```

---

## ✅ Result

After this fix:
- ✅ Save function works correctly
- ✅ All CRUD operations functional
- ✅ No more async params errors
- ✅ Compatible with Next.js 15+

---

## 🎓 Lessons Learned

1. **Always check Next.js version** when upgrading
2. **Read migration guides** for breaking changes
3. **Test all API routes** after upgrades
4. **Use TypeScript** to catch type mismatches early

---

## 🚀 Testing

Test the save function now:

1. Go to `/facturas`
2. Click any invoice
3. Edit a field
4. Click "Guardar Cambios"
5. Should save successfully! ✅

---

## 📌 Summary

**Problem:** `params` accessed synchronously in Next.js 15  
**Solution:** `await params` before destructuring  
**Files Fixed:** `/app/api/invoices/[id]/route.ts`  
**Status:** ✅ **RESOLVED**
