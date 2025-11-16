from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class Item(BaseModel):
    descripcion: Optional[str] = None
    cantidad: Optional[float] = None
    precioUnitario: Optional[float] = None
    total: Optional[float] = None

class Proveedor(BaseModel):
    nombre: Optional[str] = None
    rfc: Optional[str] = None
    nit: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None

class Cliente(BaseModel):
    nombre: Optional[str] = None
    rfc: Optional[str] = None
    nit: Optional[str] = None
    direccion: Optional[str] = None

class Metadata(BaseModel):
    fileName: str
    fileSize: Optional[int] = None
    mimeType: Optional[str] = None
    processedAt: str
    model: Optional[str] = "gpt-4o"
    validatedAt: Optional[str] = None
    validatedBy: Optional[str] = None
    wasModified: Optional[bool] = False
    s3Url: Optional[str] = None
    s3Key: Optional[str] = None

class InvoiceBase(BaseModel):
    numeroFactura: Optional[str] = None
    fecha: Optional[str] = None
    fechaVencimiento: Optional[str] = None
    proveedor: Optional[Proveedor] = None
    cliente: Optional[Cliente] = None
    items: Optional[List[Item]] = []
    subtotal: Optional[float] = None
    iva: Optional[float] = None
    total: Optional[float] = None
    moneda: Optional[str] = None
    formaPago: Optional[str] = None
    metodoPago: Optional[str] = None
    usoCFDI: Optional[str] = None
    observaciones: Optional[str] = None

class InvoiceCreate(InvoiceBase):
    metadata: Metadata

class Invoice(InvoiceBase):
    id: Optional[str] = Field(None, alias="_id")
    metadata: Metadata
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "numeroFactura": "F-001",
                "fecha": "2024-01-15",
                "total": 1000.00,
                "moneda": "MXN"
            }
        }

class InvoiceResponse(BaseModel):
    message: str
    id: Optional[str] = None
    numeroFactura: Optional[str] = None
