# 📄 Document Preview Feature

## Overview
Added a comprehensive document/image preview component to the extraction page that displays the uploaded file alongside the extracted data.

---

## ✨ Features

### 1. **Document Preview**
- **PDF Files:** Embedded iframe viewer showing the full PDF
- **Image Files:** Responsive image display with proper scaling
- **File Metadata:** Shows filename, size, and file type

### 2. **Side-by-Side View**
- Document preview on top
- Extracted JSON data below
- Both visible simultaneously for easy comparison

### 3. **Responsive Design**
- Adapts to different screen sizes
- Scrollable containers for long content
- Dark mode support

### 4. **Memory Management**
- Automatic cleanup of object URLs
- Prevents memory leaks
- Proper resource disposal on component unmount

---

## 🎨 UI Components

### **Document Preview Section**
```
┌─────────────────────────────────────┐
│ 👁️ Documento Cargado               │
├─────────────────────────────────────┤
│                                     │
│   [PDF Viewer / Image Display]     │
│                                     │
│   (500px height, scrollable)       │
│                                     │
├─────────────────────────────────────┤
│ 📄 filename.pdf  📏 245.67 KB      │
│ 🔖 PDF                              │
└─────────────────────────────────────┘
```

### **Extracted Data Section** (appears after extraction)
```
┌─────────────────────────────────────┐
│ 📄 Datos Extraídos                  │
├─────────────────────────────────────┤
│ {                                   │
│   "numeroFactura": "FAC-001",       │
│   "fecha": "2024-11-10",            │
│   ...                               │
│ }                                   │
│ (400px max height, scrollable)     │
├─────────────────────────────────────┤
│ [📋 Copiar JSON] [🔄 Nueva Factura]│
└─────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### **State Management**
```typescript
const [file, setFile] = useState<File | null>(null);
const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
```

### **Object URL Creation**
```typescript
// When file is selected
setFile(selectedFile);
setFilePreviewUrl(URL.createObjectURL(selectedFile));
```

### **Cleanup**
```typescript
// On component unmount or URL change
useEffect(() => {
  return () => {
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
  };
}, [filePreviewUrl]);
```

### **Conditional Rendering**
```typescript
{file.type === 'application/pdf' ? (
  <iframe src={filePreviewUrl} />
) : (
  <img src={filePreviewUrl} />
)}
```

---

## 📊 User Flow

### **Step 1: Upload File**
1. User selects or drags a file
2. Preview URL is created immediately
3. Document preview appears in right panel

### **Step 2: Extract Data**
1. User clicks "Extraer Datos"
2. Document preview remains visible
3. Loading spinner shows during processing

### **Step 3: View Results**
1. Extracted data appears below document
2. Both document and data are visible
3. User can compare original vs extracted

### **Step 4: Actions**
- **Copy JSON:** Copies extracted data to clipboard
- **Nueva Factura:** Resets everything for new upload
- **Validar y Guardar:** Saves to database

---

## 🎯 Benefits

### **For Users:**
- ✅ See the original document while reviewing data
- ✅ Easy visual verification of extraction accuracy
- ✅ No need to open file separately
- ✅ Immediate feedback on file upload

### **For Developers:**
- ✅ Clean state management
- ✅ Proper memory cleanup
- ✅ Reusable component pattern
- ✅ Type-safe implementation

### **For Demonstrations:**
- ✅ Professional appearance
- ✅ Clear visual flow
- ✅ Side-by-side comparison
- ✅ Better user experience

---

## 🔍 Supported File Types

| Type | Extension | Preview Method |
|------|-----------|----------------|
| PDF | `.pdf` | iframe embed |
| PNG | `.png` | img tag |
| JPEG | `.jpg`, `.jpeg` | img tag |
| WebP | `.webp` | img tag |

---

## 💡 Usage Example

```typescript
// File upload triggers preview
<input 
  type="file" 
  onChange={(e) => {
    const file = e.target.files[0];
    setFile(file);
    setFilePreviewUrl(URL.createObjectURL(file));
  }}
/>

// Preview display
{filePreviewUrl && file && (
  <div>
    {file.type === 'application/pdf' ? (
      <iframe src={filePreviewUrl} />
    ) : (
      <img src={filePreviewUrl} />
    )}
  </div>
)}
```

---

## 🎨 Styling Details

### **Colors:**
- Background: `zinc-50` (light) / `zinc-900` (dark)
- Border: `zinc-200` (light) / `zinc-700` (dark)
- Text: `zinc-700` (light) / `zinc-300` (dark)

### **Dimensions:**
- PDF iframe: 500px height
- Image: max-height 500px, auto width
- JSON container: max-height 400px

### **Spacing:**
- Padding: 4 (16px)
- Gap between sections: 4 (16px)
- Border radius: lg (8px)

---

## 🚀 Future Enhancements

Potential improvements:
1. **Zoom controls** for images
2. **Page navigation** for multi-page PDFs
3. **Fullscreen mode** for better viewing
4. **Download button** for processed file
5. **Comparison view** with highlights
6. **Thumbnail preview** in upload area

---

## 📝 Code Location

**File:** `/app/extraccion/page.tsx`

**Key Sections:**
- Lines 26: State declaration
- Lines 44-51: Cleanup effect
- Lines 65, 80: Object URL creation
- Lines 183-191: Reset handler
- Lines 527-601: Preview component

---

## ✅ Testing Checklist

- [x] PDF files display correctly in iframe
- [x] Image files display with proper scaling
- [x] File metadata shows correct information
- [x] Object URLs are cleaned up properly
- [x] Dark mode works correctly
- [x] Responsive on mobile devices
- [x] Works with drag & drop
- [x] Works with file input
- [x] Reset button clears preview
- [x] Memory doesn't leak on multiple uploads

---

## 🎉 Result

Users can now:
1. **See their document immediately** after upload
2. **Compare the original** with extracted data
3. **Verify accuracy** visually
4. **Work more efficiently** with side-by-side view

Perfect for demonstrations and production use! 🚀
