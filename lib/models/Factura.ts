import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
  descripcion: { type: String },
  cantidad: { type: Number },
  precioUnitario: { type: Number },
  total: { type: Number }
}, { _id: false });

const ProveedorSchema = new mongoose.Schema({
  nombre: { type: String },
  rfc: { type: String },
  nit: { type: String },
  direccion: { type: String },
  telefono: { type: String }
}, { _id: false });

const ClienteSchema = new mongoose.Schema({
  nombre: { type: String },
  rfc: { type: String },
  nit: { type: String },
  direccion: { type: String }
}, { _id: false });

const FacturaSchema = new mongoose.Schema({
  // Información básica
  numeroFactura: { type: String },
  fecha: { type: String },
  fechaVencimiento: { type: String },
  
  // Proveedor y Cliente
  proveedor: { type: ProveedorSchema },
  cliente: { type: ClienteSchema },
  
  // Items
  items: [ItemSchema],
  
  // Totales
  subtotal: { type: Number },
  iva: { type: Number },
  total: { type: Number },
  moneda: { type: String },
  
  // Forma de pago
  formaPago: { type: String },
  metodoPago: { type: String },
  usoCFDI: { type: String },
  
  // Observaciones
  observaciones: { type: String },
  
  // Metadata
  metadata: {
    fileName: { type: String, required: true },
    fileSize: { type: Number },
    processedAt: { type: Date, required: true },
    model: { type: String },
    validatedAt: { type: Date, default: Date.now },
    validatedBy: { type: String }
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

export default mongoose.models.Factura || mongoose.model('Factura', FacturaSchema);
