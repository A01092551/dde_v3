from fastapi import APIRouter, UploadFile, File, HTTPException, status, Query, Form
from fastapi.responses import JSONResponse
from models.invoice import InvoiceCreate, InvoiceResponse
from services.openai_service import OpenAIService
from services.invoice_service import InvoiceService
from services.s3_services import S3Service
from datetime import datetime
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/extract", response_model=dict)
async def extract_invoice(file: UploadFile = File(...)):
    """
    Extraer datos de una factura (PDF o imagen)
    """
    try:
        logger.info(f"📥 Recibiendo archivo: {file.filename}")
        
        # Validar tipo de archivo
        valid_types = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp']
        if file.content_type not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El archivo debe ser un PDF o una imagen (PNG, JPG, WEBP)"
            )
        
        # Leer contenido del archivo
        file_content = await file.read()
        logger.info(f"📄 Archivo leído: {len(file_content)} bytes")
        
        # Extraer datos usando OpenAI
        openai_service = OpenAIService()
        
        if file.content_type == 'application/pdf':
            extracted_data = await openai_service.extract_from_pdf(file_content, file.filename)
        else:
            extracted_data = await openai_service.extract_from_image(file_content, file.content_type)
        
        # Agregar metadata
        result = {
            **extracted_data,
            "metadata": {
                "fileName": file.filename,
                "fileSize": len(file_content),
                "mimeType": file.content_type,
                "processedAt": datetime.utcnow().isoformat(),
                "model": "gpt-4o"
            }
        }
        
        logger.info(f"✅ Extracción completada: {file.filename}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error al extraer factura: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al extraer datos de la factura: {str(e)}"
        )

@router.post("/validate", response_model=InvoiceResponse)
async def validate_invoice(
    invoice_data: str = Form(...),
    file: UploadFile = File(...),
    validatedBy: str = Form(None),
    wasModified: bool = Form(False)
):
    """
    Validar y guardar factura en MongoDB con archivo original en S3
    """
    try:
        # Parsear los datos de la factura desde JSON
        invoice_dict = json.loads(invoice_data)
        invoice = InvoiceCreate(**invoice_dict)
        
        logger.info(f"📥 Validando factura: {invoice.numeroFactura} por {validatedBy}")
        
        # Subir archivo a S3
        s3_service = S3Service()
        if s3_service.client:  # Solo si S3 está configurado
            try:
                file_content = await file.read()
                s3_data = s3_service.upload_file(
                    file_content=file_content,
                    file_name=file.filename,
                    content_type=file.content_type
                )
                
                # Agregar información de S3 a metadata
                invoice.metadata.s3Key = s3_data['s3Key']
                invoice.metadata.s3Url = s3_data['s3Url']
                logger.info(f"✅ Archivo subido a S3: {s3_data['s3Key']}")
            except Exception as e:
                logger.warning(f"⚠️ No se pudo subir a S3: {e}")
                # Continuar sin S3 si falla
        
        # Agregar metadata de validación
        invoice.metadata.validatedAt = datetime.utcnow().isoformat()
        invoice.metadata.validatedBy = validatedBy
        invoice.metadata.wasModified = wasModified
        
        invoice_service = InvoiceService()
        invoice_id = await invoice_service.create_invoice(invoice)
        
        logger.info(f"✅ Factura guardada: {invoice_id} (Modificada: {wasModified})")
        
        return InvoiceResponse(
            message="Factura validada y guardada exitosamente",
            id=invoice_id,
            numeroFactura=invoice.numeroFactura
        )
        
    except ValueError as e:
        # Error de duplicado
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"❌ Error al validar factura: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al validar la factura: {str(e)}"
        )

@router.get("", response_model=dict)
async def list_invoices(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    numero: str = Query(None)
):
    """
    Listar facturas con paginación y búsqueda
    """
    try:
        logger.info(f"📋 Listando facturas (skip={skip}, limit={limit}, numero={numero})")
        
        invoice_service = InvoiceService()
        result = await invoice_service.list_invoices(skip=skip, limit=limit, numero=numero)
        
        logger.info(f"✅ Facturas encontradas: {result['total']}")
        
        return {
            "data": result["data"],
            "pagination": {
                "total": result["total"],
                "skip": skip,
                "limit": limit,
                "hasMore": result["hasMore"]
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Error al listar facturas: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener facturas: {str(e)}"
        )

@router.get("/image", response_model=dict)
async def get_invoice_image(key: str = Query(...)):
    """
    Obtener URL firmada para imagen de factura en S3
    """
    try:
        logger.info(f"🖼️ Generando URL firmada para: {key}")
        
        # Si no hay configuración de S3, retornar error amigable
        from config import settings
        if not settings.AWS_S3_BUCKET_NAME:
            logger.warning("⚠️ S3 no está configurado")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Imagen no disponible - S3 no configurado"
            )
        
        import boto3
        from botocore.exceptions import ClientError
        
        s3_client = boto3.client(
            's3',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
        
        # Generar URL firmada válida por 1 hora
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': settings.AWS_S3_BUCKET_NAME, 'Key': key},
            ExpiresIn=3600
        )
        
        logger.info(f"✅ URL firmada generada para: {key}")
        return {"url": url}
        
    except ClientError as e:
        logger.error(f"❌ Error de S3: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al acceder a S3"
        )
    except Exception as e:
        logger.error(f"❌ Error al generar URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al generar URL: {str(e)}"
        )

@router.get("/{invoice_id}", response_model=dict)
async def get_invoice(invoice_id: str):
    """
    Obtener una factura por ID
    """
    try:
        logger.info(f"🔍 Buscando factura: {invoice_id}")
        
        invoice_service = InvoiceService()
        invoice = await invoice_service.get_invoice(invoice_id)
        
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Factura no encontrada"
            )
        
        logger.info(f"✅ Factura encontrada: {invoice_id}")
        return invoice
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error al obtener factura: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener la factura: {str(e)}"
        )

@router.put("/{invoice_id}", response_model=dict)
async def update_invoice(invoice_id: str, invoice_data: dict):
    """
    Actualizar una factura existente
    """
    try:
        logger.info(f"✏️ Actualizando factura: {invoice_id}")
        
        invoice_service = InvoiceService()
        updated = await invoice_service.update_invoice(invoice_id, invoice_data)
        
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Factura no encontrada"
            )
        
        logger.info(f"✅ Factura actualizada: {invoice_id}")
        return updated
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error al actualizar factura: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar la factura: {str(e)}"
        )

@router.delete("/{invoice_id}", response_model=dict)
async def delete_invoice(invoice_id: str):
    """
    Eliminar una factura
    """
    try:
        logger.info(f"🗑️ Eliminando factura: {invoice_id}")
        
        invoice_service = InvoiceService()
        deleted = await invoice_service.delete_invoice(invoice_id)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Factura no encontrada"
            )
        
        logger.info(f"✅ Factura eliminada: {invoice_id}")
        return {"message": "Factura eliminada exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error al eliminar factura: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar la factura: {str(e)}"
        )

@router.get("/stats/summary", response_model=dict)
async def get_stats():
    """
    Obtener estadísticas del sistema
    """
    try:
        logger.info("📊 Obteniendo estadísticas del sistema")
        
        invoice_service = InvoiceService()
        stats = await invoice_service.get_statistics()
        
        logger.info(f"✅ Estadísticas obtenidas: {stats}")
        return stats
        
    except Exception as e:
        logger.error(f"❌ Error al obtener estadísticas: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener estadísticas: {str(e)}"
        )
