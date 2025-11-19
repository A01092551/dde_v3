import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
  descripcion: { 
    type: String,
    trim: true,
    maxlength: [500, 'Descripción no puede exceder 500 caracteres']
  },
  cantidad: { 
    type: Number,
    min: [0, 'Cantidad no puede ser negativa'],
    validate: {
      validator: function(v: number) {
        return v === null || v === undefined || !isNaN(v);
      },
      message: 'Cantidad debe ser un número válido'
    }
  },
  precioUnitario: { 
    type: Number,
    min: [0, 'Precio unitario no puede ser negativo'],
    validate: {
      validator: function(v: number) {
        return v === null || v === undefined || !isNaN(v);
      },
      message: 'Precio unitario debe ser un número válido'
    }
  },
  total: { 
    type: Number,
    min: [0, 'Total no puede ser negativo'],
    validate: {
      validator: function(v: number) {
        return v === null || v === undefined || !isNaN(v);
      },
      message: 'Total debe ser un número válido'
    }
  }
}, { _id: false });

const ProveedorSchema = new mongoose.Schema({
  nombre: { 
    type: String,
    trim: true,
    maxlength: [255, 'Nombre no puede exceder 255 caracteres']
  },
  rfc: { 
    type: String,
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        return /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(v);
      },
      message: 'RFC inválido'
    }
  },
  nit: { 
    type: String,
    trim: true,
    maxlength: [50, 'NIT no puede exceder 50 caracteres']
  },
  direccion: { 
    type: String,
    trim: true,
    maxlength: [500, 'Dirección no puede exceder 500 caracteres']
  },
  telefono: { 
    type: String,
    trim: true,
    maxlength: [20, 'Teléfono no puede exceder 20 caracteres']
  }
}, { _id: false });

const ClienteSchema = new mongoose.Schema({
  nombre: { 
    type: String,
    trim: true,
    maxlength: [255, 'Nombre no puede exceder 255 caracteres']
  },
  rfc: { 
    type: String,
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        return /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(v);
      },
      message: 'RFC inválido'
    }
  },
  nit: { 
    type: String,
    trim: true,
    maxlength: [50, 'NIT no puede exceder 50 caracteres']
  },
  direccion: { 
    type: String,
    trim: true,
    maxlength: [500, 'Dirección no puede exceder 500 caracteres']
  }
}, { _id: false });

const FacturaSchema = new mongoose.Schema({
  // Información básica
  numeroFactura: { 
    type: String,
    trim: true,
    maxlength: [100, 'Número de factura no puede exceder 100 caracteres'],
    index: true
  },
  fecha: { 
    type: String,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        return /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v));
      },
      message: 'Fecha debe estar en formato YYYY-MM-DD'
    }
  },
  fechaVencimiento: { 
    type: String,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        return /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v));
      },
      message: 'Fecha de vencimiento debe estar en formato YYYY-MM-DD'
    }
  },
  
  // Proveedor y Cliente
  proveedor: { type: ProveedorSchema },
  cliente: { type: ClienteSchema },
  
  // Items
  items: {
    type: [ItemSchema],
    validate: {
      validator: function(items: any[]) {
        return !items || items.length <= 1000; // Reasonable limit
      },
      message: 'No se pueden tener más de 1000 items'
    }
  },
  
  // Totales
  subtotal: { 
    type: Number,
    min: [0, 'Subtotal no puede ser negativo'],
    validate: {
      validator: function(v: number) {
        return v === null || v === undefined || (!isNaN(v) && isFinite(v));
      },
      message: 'Subtotal debe ser un número válido'
    }
  },
  iva: { 
    type: Number,
    min: [0, 'IVA no puede ser negativo'],
    validate: {
      validator: function(v: number) {
        return v === null || v === undefined || (!isNaN(v) && isFinite(v));
      },
      message: 'IVA debe ser un número válido'
    }
  },
  total: { 
    type: Number,
    min: [0, 'Total no puede ser negativo'],
    validate: {
      validator: function(v: number) {
        return v === null || v === undefined || (!isNaN(v) && isFinite(v));
      },
      message: 'Total debe ser un número válido'
    }
  },
  moneda: { 
    type: String,
    uppercase: true,
    enum: {
      values: ['MXN', 'USD', 'EUR', 'GBP', 'CAD', 'JPY', 'CNY', ''],
      message: '{VALUE} no es un código de moneda válido'
    },
    default: 'MXN'
  },
  
  // Forma de pago
  formaPago: { 
    type: String,
    trim: true,
    maxlength: [100, 'Forma de pago no puede exceder 100 caracteres']
  },
  metodoPago: { 
    type: String,
    trim: true,
    maxlength: [100, 'Método de pago no puede exceder 100 caracteres']
  },
  usoCFDI: { 
    type: String,
    trim: true,
    maxlength: [100, 'Uso CFDI no puede exceder 100 caracteres']
  },
  
  // Observaciones
  observaciones: { 
    type: String,
    trim: true,
    maxlength: [2000, 'Observaciones no pueden exceder 2000 caracteres']
  },
  
  // Metadata
  metadata: {
    fileName: { 
      type: String, 
      required: [true, 'Nombre de archivo es requerido'],
      trim: true,
      maxlength: [255, 'Nombre de archivo no puede exceder 255 caracteres']
    },
    fileSize: { 
      type: Number,
      min: [0, 'Tamaño de archivo no puede ser negativo'],
      max: [52428800, 'Tamaño de archivo no puede exceder 50MB'] // 50MB in bytes
    },
    processedAt: { 
      type: Date, 
      required: [true, 'Fecha de procesamiento es requerida'],
      default: Date.now
    },
    model: { 
      type: String,
      trim: true,
      maxlength: [50, 'Modelo no puede exceder 50 caracteres']
    },
    validatedAt: { 
      type: Date,
      default: Date.now
    },
    validatedBy: { 
      type: String,
      trim: true,
      maxlength: [255, 'Validado por no puede exceder 255 caracteres']
    },
    wasModified: {
      type: Boolean,
      default: false
    },
    s3Url: { 
      type: String,
      trim: true,
      maxlength: [1000, 'URL de S3 no puede exceder 1000 caracteres']
    },
    s3Key: { 
      type: String,
      trim: true,
      maxlength: [500, 'Key de S3 no puede exceder 500 caracteres']
    }
  },
  
  // Datos raw (opcional, para debugging)
  rawData: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

// Índices para búsquedas rápidas
FacturaSchema.index({ numeroFactura: 1 });
FacturaSchema.index({ 'metadata.processedAt': -1 });
FacturaSchema.index({ 'metadata.validatedAt': -1 });
FacturaSchema.index({ 'proveedor.rfc': 1 });
FacturaSchema.index({ 'cliente.rfc': 1 });

// Validación personalizada para totales
FacturaSchema.pre('save', function(next) {
  // Validate invoice totals if all fields are present
  if (this.subtotal !== undefined && this.iva !== undefined && this.total !== undefined) {
    const calculatedTotal = this.subtotal + this.iva;
    const difference = Math.abs(this.total - calculatedTotal);
    
    if (difference > 0.01) {
      return next(new Error(`Total (${this.total}) no coincide con Subtotal + IVA (${calculatedTotal.toFixed(2)})`));
    }
  }
  
  // Validate item totals
  if (this.items && this.items.length > 0) {
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      if (item.cantidad !== undefined && item.precioUnitario !== undefined && item.total !== undefined) {
        const calculatedItemTotal = item.cantidad * item.precioUnitario;
        const itemDifference = Math.abs(item.total - calculatedItemTotal);
        
        if (itemDifference > 0.01) {
          return next(new Error(`Item ${i + 1}: Total (${item.total}) no coincide con Cantidad × Precio (${calculatedItemTotal.toFixed(2)})`));
        }
      }
    }
  }
  
  next();
});

export default mongoose.models.Factura || mongoose.model('Factura', FacturaSchema);
