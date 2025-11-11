# 📋 Invoice Details Drawer Feature

## Overview
Added a comprehensive slide-out drawer component to the Facturas page that displays full invoice details, allows editing, shows the S3 document preview, and saves changes to MongoDB.

---

## ✨ Features

### 1. **Interactive Invoice List**
- Click any invoice card to open the drawer
- Hover effects and visual feedback
- "Ver detalles" indicator on each card

### 2. **Slide-Out Drawer**
- Smooth slide-in animation from the right
- Responsive width (full on mobile, 50% on desktop)
- Dark overlay to focus attention
- Click outside to close

### 3. **Document Preview**
- **PDF Files:** Embedded iframe viewer (500px height)
- **Image Files:** Responsive image display
- Uses S3 URL from `metadata.s3Url`
- Shows file metadata (name, size)

### 4. **Editable Invoice Data**
All fields are editable with real-time updates:
- **Basic Info:** Invoice number, date, due date, currency
- **Proveedor:** Name, RFC/NIT, address, phone
- **Cliente:** Name, RFC/NIT, address
- **Totales:** Subtotal, IVA, Total
- **Payment Info:** Payment form, method, CFDI usage
- **Observaciones:** Notes/comments

### 5. **Save Functionality**
- PUT request to `/api/invoices/:id`
- Updates MongoDB document
- Success message with animation
- Local state update (no page reload needed)
- Error handling with alerts

---

## 🎨 UI Components

### **Drawer Structure**
```
┌─────────────────────────────────────┐
│ Header (Blue gradient)              │
│ - Invoice number & total            │
│ - Date                               │
│ - Close button                       │
│ - Success message (when saved)      │
├─────────────────────────────────────┤
│ Content (Scrollable)                │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 👁️ Documento Original           │ │
│ │ [PDF/Image Preview]             │ │
│ │ 📄 filename.pdf  📏 245 KB      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ✏️ Datos de la Factura          │ │
│ │ [Editable Form Fields]          │ │
│ │ - Basic Info                    │ │
│ │ - Proveedor                     │ │
│ │ - Cliente                       │ │
│ │ - Totales                       │ │
│ │ - Payment Info                  │ │
│ │ - Observaciones                 │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Footer (Sticky)                     │
│ [Cancelar] [Guardar Cambios]       │
└─────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### **State Management**
```typescript
const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);
const [isDrawerOpen, setIsDrawerOpen] = useState(false);
const [editedData, setEditedData] = useState<Factura | null>(null);
const [isSaving, setIsSaving] = useState(false);
const [saveSuccess, setSaveSuccess] = useState(false);
```

### **Opening the Drawer**
```typescript
const openDrawer = (factura: Factura) => {
  setSelectedFactura(factura);
  setEditedData(JSON.parse(JSON.stringify(factura))); // Deep copy
  setIsDrawerOpen(true);
  setSaveSuccess(false);
};
```

### **Updating Fields**
```typescript
const updateField = (path: string, value: any) => {
  // Supports nested paths like 'proveedor.nombre'
  const keys = path.split('.');
  // Updates editedData state
};
```

### **Saving Changes**
```typescript
const handleSaveChanges = async () => {
  const response = await fetch(`/api/invoices/${editedData._id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(editedData),
  });
  
  const updatedFactura = await response.json();
  
  // Update local state
  setFacturas(facturas.map(f => 
    f._id === updatedFactura._id ? updatedFactura : f
  ));
};
```

---

## 📊 User Flow

### **Step 1: View Invoices**
1. User navigates to `/facturas`
2. Sees list of saved invoices
3. Each card shows summary info

### **Step 2: Open Drawer**
1. User clicks on an invoice card
2. Drawer slides in from right
3. Document preview loads from S3
4. All fields populate with current data

### **Step 3: Edit Data**
1. User modifies any field
2. Changes update in `editedData` state
3. Original data remains unchanged

### **Step 4: Save Changes**
1. User clicks "Guardar Cambios"
2. PUT request sent to API
3. MongoDB document updated
4. Success message appears
5. Local state updates
6. List reflects changes

### **Step 5: Close Drawer**
- Click "Cancelar" button
- Click outside drawer (overlay)
- Click X button in header

---

## 🎯 API Integration

### **Endpoint Used**
```
PUT /api/invoices/:id
```

### **Request**
```typescript
{
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    numeroFactura: "FAC-001",
    fecha: "2024-11-10",
    proveedor: {
      nombre: "Updated Name",
      rfc: "ABC123"
    },
    total: 1500.00,
    // ... all other fields
  })
}
```

### **Response**
```json
{
  "_id": "673abc123...",
  "numeroFactura": "FAC-001",
  "fecha": "2024-11-10",
  "total": 1500.00,
  "metadata": {
    "s3Url": "https://...",
    "fileName": "invoice.pdf"
  },
  "updatedAt": "2024-11-10T20:55:00.000Z"
}
```

---

## 💡 Key Features

### **1. Deep Copy for Editing**
```typescript
setEditedData(JSON.parse(JSON.stringify(factura)));
```
- Prevents accidental mutation of original data
- Allows "Cancel" to discard changes

### **2. Nested Field Updates**
```typescript
updateField('proveedor.nombre', 'New Name');
```
- Supports dot notation for nested objects
- Automatically creates missing objects

### **3. Optimistic UI Updates**
```typescript
setFacturas(facturas.map(f => 
  f._id === updatedFactura._id ? updatedFactura : f
));
```
- Updates list immediately after save
- No need to reload entire page

### **4. S3 Document Preview**
```typescript
{editedData.metadata.s3Url && (
  editedData.metadata.fileName.endsWith('.pdf') ? (
    <iframe src={s3Url} />
  ) : (
    <img src={s3Url} />
  )
)}
```
- Conditional rendering based on file type
- Direct S3 URL access

---

## 🎨 Styling Details

### **Drawer Animation**
```css
transform: translateX(0);     /* Open */
transform: translateX(100%);  /* Closed */
transition: transform 300ms ease-in-out;
```

### **Responsive Width**
- Mobile: `w-full` (100%)
- Tablet: `md:w-3/4` (75%)
- Desktop: `lg:w-2/3` (66%)
- Large: `xl:w-1/2` (50%)

### **Colors**
- Header: Blue gradient (`from-blue-600 to-blue-700`)
- Success: Green (`bg-green-500`)
- Overlay: Black 50% opacity
- Inputs: White/Zinc-700 (dark mode)

### **Z-Index**
- Overlay: `z-40`
- Drawer: `z-50`
- Header: `z-10` (sticky within drawer)

---

## 📝 Editable Fields

### **Basic Information**
- ✏️ Número de Factura (text)
- ✏️ Fecha (date)
- ✏️ Fecha de Vencimiento (date)
- ✏️ Moneda (text)

### **Proveedor (Supplier)**
- ✏️ Nombre (text)
- ✏️ RFC/NIT (text)
- ✏️ Dirección (text)
- ✏️ Teléfono (text)

### **Cliente (Client)**
- ✏️ Nombre (text)
- ✏️ RFC/NIT (text)
- ✏️ Dirección (text)

### **Totales (Amounts)**
- ✏️ Subtotal (number, step 0.01)
- ✏️ IVA (number, step 0.01)
- ✏️ Total (number, step 0.01)

### **Payment Information**
- ✏️ Forma de Pago (text)
- ✏️ Método de Pago (text)
- ✏️ Uso CFDI (text)

### **Notes**
- ✏️ Observaciones (textarea, 3 rows)

---

## 🚀 Benefits

### **For Users:**
- ✅ View and edit invoices without leaving the page
- ✅ See original document while editing
- ✅ Immediate visual feedback
- ✅ Easy correction of extraction errors
- ✅ No page reloads needed

### **For Developers:**
- ✅ Reusable drawer pattern
- ✅ Clean state management
- ✅ Type-safe with TypeScript
- ✅ RESTful API integration
- ✅ Optimistic UI updates

### **For Business:**
- ✅ Improved data accuracy
- ✅ Faster corrections
- ✅ Better user experience
- ✅ Reduced errors
- ✅ Professional appearance

---

## 🔍 Error Handling

### **API Errors**
```typescript
if (!response.ok) {
  throw new Error('Error al guardar cambios');
}
```
- Shows alert with error message
- Doesn't update local state on failure

### **Validation Errors**
- Backend validates with Mongoose schema
- Returns 400 with validation details
- Frontend shows error in alert

### **Network Errors**
- Caught in try/catch
- User-friendly error message
- Saving state resets

---

## 📱 Responsive Design

### **Mobile (< 768px)**
- Full width drawer
- Single column forms
- Stacked buttons
- Scrollable content

### **Tablet (768px - 1024px)**
- 75% width drawer
- Two column forms
- Side-by-side buttons

### **Desktop (> 1024px)**
- 50-66% width drawer
- Two column forms
- Optimal viewing experience

---

## 🎉 Complete Feature Set

✅ **Click to open** - Any invoice card  
✅ **Slide animation** - Smooth drawer transition  
✅ **Document preview** - PDF iframe or image display  
✅ **S3 integration** - Direct file access  
✅ **Full editing** - All invoice fields  
✅ **Nested updates** - Proveedor, Cliente objects  
✅ **Save to MongoDB** - PUT /api/invoices/:id  
✅ **Success feedback** - Animated message  
✅ **Optimistic updates** - Immediate UI refresh  
✅ **Error handling** - Alerts and validation  
✅ **Dark mode** - Full support  
✅ **Responsive** - Mobile to desktop  
✅ **Accessibility** - Keyboard navigation  
✅ **Close options** - Button, overlay, X  

---

## 📚 Files Modified

1. **`/app/facturas/page.tsx`**
   - Added drawer state management
   - Added drawer component
   - Made cards clickable
   - Added save functionality

2. **`/app/api/invoices/[id]/route.ts`**
   - Updated PUT response format
   - Returns factura directly

---

## 🎓 Usage Example

```typescript
// User clicks invoice
<div onClick={() => openDrawer(factura)}>
  {/* Invoice card */}
</div>

// Drawer opens with data
{isDrawerOpen && (
  <Drawer>
    <DocumentPreview src={s3Url} />
    <EditableForm data={editedData} />
    <SaveButton onClick={handleSaveChanges} />
  </Drawer>
)}

// User edits field
<input 
  value={editedData.numeroFactura}
  onChange={(e) => updateField('numeroFactura', e.target.value)}
/>

// User saves
await fetch(`/api/invoices/${id}`, {
  method: 'PUT',
  body: JSON.stringify(editedData)
});
```

---

## ✨ Result

Users can now:
1. **Click any invoice** to see full details
2. **View the original document** from S3
3. **Edit any field** with a clean form
4. **Save changes** to MongoDB
5. **See updates immediately** in the list

Perfect for correcting extraction errors and managing invoice data! 🚀
