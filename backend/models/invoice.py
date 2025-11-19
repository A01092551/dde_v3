from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List
from datetime import datetime
import re

class Item(BaseModel):
    descripcion: Optional[str] = Field(None, max_length=500)
    cantidad: Optional[float] = Field(None, ge=0)
    precioUnitario: Optional[float] = Field(None, ge=0)
    total: Optional[float] = Field(None, ge=0)
    
    @field_validator('cantidad', 'precioUnitario', 'total')
    @classmethod
    def validate_numbers(cls, v):
        if v is not None and (not isinstance(v, (int, float)) or v < 0):
            raise ValueError('Debe ser un número positivo')
        return v

class Proveedor(BaseModel):
    nombre: Optional[str] = Field(None, max_length=255)
    rfc: Optional[str] = Field(None, max_length=50)  # Increased max length to allow flexible formats
    nit: Optional[str] = Field(None, max_length=50)
    direccion: Optional[str] = Field(None, max_length=500)
    telefono: Optional[str] = Field(None, max_length=20)

class Cliente(BaseModel):
    nombre: Optional[str] = Field(None, max_length=255)
    rfc: Optional[str] = Field(None, max_length=50)  # Increased max length to allow flexible formats
    nit: Optional[str] = Field(None, max_length=50)
    direccion: Optional[str] = Field(None, max_length=500)

class Metadata(BaseModel):
    fileName: str = Field(..., max_length=255, min_length=1)
    fileSize: Optional[int] = Field(None, ge=0, le=52428800)  # Max 50MB
    mimeType: Optional[str] = Field(None, max_length=100)
    processedAt: str
    model: Optional[str] = Field("gpt-4o", max_length=50)
    validatedAt: Optional[str] = None
    validatedBy: Optional[str] = Field(None, max_length=255)
    wasModified: Optional[bool] = False
    s3Url: Optional[str] = Field(None, max_length=1000)
    s3Key: Optional[str] = Field(None, max_length=500)
    
    @field_validator('fileName')
    @classmethod
    def validate_filename(cls, v):
        if not v or not v.strip():
            raise ValueError('Nombre de archivo es requerido')
        # Remove path traversal attempts
        if '..' in v or '/' in v or '\\' in v:
            raise ValueError('Nombre de archivo inválido')
        return v.strip()

class InvoiceBase(BaseModel):
    numeroFactura: Optional[str] = Field(None, max_length=100)
    fecha: Optional[str] = None
    fechaVencimiento: Optional[str] = None
    proveedor: Optional[Proveedor] = None
    cliente: Optional[Cliente] = None
    items: Optional[List[Item]] = Field(default_factory=list, max_length=1000)
    subtotal: Optional[float] = Field(None, ge=0)
    iva: Optional[float] = Field(None, ge=0)
    total: Optional[float] = Field(None, ge=0)
    moneda: Optional[str] = Field(None, max_length=3)
    formaPago: Optional[str] = Field(None, max_length=100)
    metodoPago: Optional[str] = Field(None, max_length=100)
    usoCFDI: Optional[str] = Field(None, max_length=100)
    observaciones: Optional[str] = Field(None, max_length=2000)
    
    @field_validator('fecha', 'fechaVencimiento')
    @classmethod
    def validate_date_format(cls, v):
        if v is not None and v.strip():
            # Validate YYYY-MM-DD format
            if not re.match(r'^\d{4}-\d{2}-\d{2}$', v):
                raise ValueError('Fecha debe estar en formato YYYY-MM-DD')
            # Try to parse to ensure it's a valid date
            try:
                datetime.strptime(v, '%Y-%m-%d')
            except ValueError:
                raise ValueError('Fecha inválida')
        return v
    
    @field_validator('moneda')
    @classmethod
    def validate_currency(cls, v):
        if v is not None and v.strip():
            valid_currencies = ['MXN', 'USD', 'EUR', 'GBP', 'CAD', 'JPY', 'CNY']
            if v.upper() not in valid_currencies:
                raise ValueError(f'Moneda debe ser una de: {", ".join(valid_currencies)}')
            return v.upper()
        return v
    
    @field_validator('subtotal', 'iva', 'total')
    @classmethod
    def validate_amounts(cls, v):
        if v is not None:
            if not isinstance(v, (int, float)) or v < 0:
                raise ValueError('Monto debe ser un número positivo')
            if not float('-inf') < v < float('inf'):
                raise ValueError('Monto debe ser un número finito')
        return v
    
    @model_validator(mode='after')
    def validate_invoice_totals(self):
        """Validate that total = subtotal + iva"""
        if self.subtotal is not None and self.iva is not None and self.total is not None:
            calculated = self.subtotal + self.iva
            if abs(self.total - calculated) > 0.01:
                raise ValueError(f'Total ({self.total}) no coincide con Subtotal + IVA ({calculated:.2f})')
        return self

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
