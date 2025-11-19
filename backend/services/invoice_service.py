from database.mongodb import get_collection
from models.invoice import Invoice, InvoiceCreate
from bson import ObjectId
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class InvoiceService:
    def __init__(self):
        self.collection = get_collection("invoices")
    
    async def create_invoice(self, invoice_data: InvoiceCreate) -> str:
        """Crear una nueva factura en MongoDB"""
        try:
            # Verificar duplicados
            if invoice_data.numeroFactura:
                existing = await self.collection.find_one({
                    "numeroFactura": invoice_data.numeroFactura
                })
                if existing:
                    raise ValueError(f"Ya existe una factura con el número {invoice_data.numeroFactura}")
            
            # Preparar datos
            invoice_dict = invoice_data.model_dump(exclude_none=True)
            invoice_dict["createdAt"] = datetime.utcnow()
            invoice_dict["updatedAt"] = datetime.utcnow()
            
            # Insertar en MongoDB
            result = await self.collection.insert_one(invoice_dict)
            logger.info(f"✅ Factura creada: {result.inserted_id}")
            
            return str(result.inserted_id)
            
        except Exception as e:
            logger.error(f"❌ Error al crear factura: {e}")
            raise
    
    async def get_invoice(self, invoice_id: str) -> dict:
        """Obtener una factura por ID"""
        try:
            invoice = await self.collection.find_one({"_id": ObjectId(invoice_id)})
            if invoice:
                invoice["_id"] = str(invoice["_id"])
            return invoice
        except Exception as e:
            logger.error(f"❌ Error al obtener factura: {e}")
            raise
    
    async def list_invoices(self, skip: int = 0, limit: int = 50, numero: str = None):
        """Listar facturas con paginación"""
        try:
            query = {}
            if numero:
                query["numeroFactura"] = {"$regex": numero, "$options": "i"}
            
            cursor = self.collection.find(query).sort("createdAt", -1).skip(skip).limit(limit)
            invoices = await cursor.to_list(length=limit)
            
            # Convertir ObjectId a string
            for invoice in invoices:
                invoice["_id"] = str(invoice["_id"])
            
            total = await self.collection.count_documents(query)
            
            return {
                "data": invoices,
                "total": total,
                "skip": skip,
                "limit": limit,
                "hasMore": skip + limit < total
            }
        except Exception as e:
            logger.error(f"❌ Error al listar facturas: {e}")
            raise
    
    async def update_invoice(self, invoice_id: str, invoice_data: dict) -> dict:
        """Actualizar una factura existente"""
        try:
            # Remover _id del dict si existe
            if "_id" in invoice_data:
                del invoice_data["_id"]
            
            # Agregar timestamp de actualización
            invoice_data["updatedAt"] = datetime.utcnow()
            
            # Actualizar en MongoDB
            result = await self.collection.find_one_and_update(
                {"_id": ObjectId(invoice_id)},
                {"$set": invoice_data},
                return_document=True
            )
            
            if result:
                result["_id"] = str(result["_id"])
                logger.info(f"✅ Factura actualizada: {invoice_id}")
            
            return result
        except Exception as e:
            logger.error(f"❌ Error al actualizar factura: {e}")
            raise
    
    async def delete_invoice(self, invoice_id: str) -> bool:
        """Eliminar una factura"""
        try:
            result = await self.collection.delete_one({"_id": ObjectId(invoice_id)})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"❌ Error al eliminar factura: {e}")
            raise
    
    async def get_statistics(self) -> dict:
        """Obtener estadísticas del sistema"""
        try:
            # Total de facturas
            total = await self.collection.count_documents({})
            
            # Facturas validadas (tienen validatedAt)
            validated = await self.collection.count_documents({
                "metadata.validatedAt": {"$exists": True, "$ne": None}
            })
            
            # Facturas modificadas (wasModified = true)
            modified = await self.collection.count_documents({
                "metadata.wasModified": True
            })
            
            # Facturas con archivo en S3
            with_s3 = await self.collection.count_documents({
                "metadata.s3Key": {"$exists": True, "$ne": None}
            })
            
            # Facturas por validar (tienen processedAt pero NO tienen validatedAt)
            pending_validation = await self.collection.count_documents({
                "metadata.processedAt": {"$exists": True, "$ne": None},
                "metadata.validatedAt": {"$exists": False}
            })
            
            # Facturas por mes (últimos 6 meses)
            pipeline_monthly = [
                {"$match": {"metadata.validatedAt": {"$exists": True}}},
                {"$project": {
                    "month": {"$substr": ["$metadata.validatedAt", 0, 7]}  # YYYY-MM
                }},
                {"$group": {
                    "_id": "$month",
                    "count": {"$sum": 1}
                }},
                {"$sort": {"_id": -1}},
                {"$limit": 6}
            ]
            monthly_cursor = self.collection.aggregate(pipeline_monthly)
            monthly_stats = await monthly_cursor.to_list(length=6)
            
            # Historial de eventos (últimas 20 facturas validadas)
            history_cursor = self.collection.find(
                {"metadata.validatedAt": {"$exists": True, "$ne": None}},
                {
                    "numeroFactura": 1,
                    "metadata.validatedBy": 1,
                    "metadata.validatedAt": 1,
                    "metadata.wasModified": 1
                }
            ).sort("metadata.validatedAt", -1).limit(20)
            
            history = await history_cursor.to_list(length=20)
            
            # Formatear historial
            history_formatted = []
            for item in history:
                history_formatted.append({
                    "invoiceNumber": item.get("numeroFactura", "N/A"),
                    "user": item.get("metadata", {}).get("validatedBy", "Desconocido"),
                    "wasModified": item.get("metadata", {}).get("wasModified", False),
                    "timestamp": item.get("metadata", {}).get("validatedAt", ""),
                    "action": "validated"
                })
            
            return {
                "total": total,
                "validated": validated,
                "modified": modified,
                "with_s3": with_s3,
                "pending_validation": pending_validation,
                "by_month": monthly_stats,
                "history": history_formatted
            }
        except Exception as e:
            logger.error(f"❌ Error al obtener estadísticas: {e}")
            raise
