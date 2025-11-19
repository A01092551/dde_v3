import boto3
from botocore.exceptions import ClientError
from config import settings
import logging
from datetime import datetime
import os

logger = logging.getLogger(__name__)

class S3Service:
    def __init__(self):
        if not settings.AWS_S3_BUCKET_NAME:
            logger.warning("⚠️ S3 no está configurado")
            self.client = None
            self.bucket_name = None
            return
            
        self.client = boto3.client(
            's3',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
        self.bucket_name = settings.AWS_S3_BUCKET_NAME
        logger.info(f"✅ S3 Service inicializado - Bucket: {self.bucket_name}")
    
    def upload_file(self, file_content: bytes, file_name: str, content_type: str) -> dict:
        """
        Subir archivo a S3 y retornar la información del archivo
        
        Args:
            file_content: Contenido del archivo en bytes
            file_name: Nombre original del archivo
            content_type: Tipo MIME del archivo
            
        Returns:
            dict con s3Key y s3Url
        """
        if not self.client:
            raise ValueError("S3 no está configurado")
        
        # Validaciones
        if not file_content:
            raise ValueError("Contenido del archivo está vacío")
        
        if not file_name or not file_name.strip():
            raise ValueError("Nombre de archivo es requerido")
        
        # Validar tamaño (máximo 50MB)
        MAX_FILE_SIZE = 50 * 1024 * 1024
        if len(file_content) > MAX_FILE_SIZE:
            raise ValueError(f"Archivo demasiado grande ({len(file_content) / 1024 / 1024:.2f}MB). Máximo: 50MB")
        
        # Sanitizar nombre de archivo
        safe_file_name = file_name.replace('..', '').replace('/', '_').replace('\\', '_')
        
        try:
            # Generar key único usando timestamp y nombre de archivo
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            file_extension = os.path.splitext(safe_file_name)[1]
            s3_key = f"invoices/{timestamp}_{safe_file_name}"
            
            # Subir a S3
            self.client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=file_content,
                ContentType=content_type,
                Metadata={
                    'original-filename': file_name,
                    'upload-timestamp': timestamp
                }
            )
            
            # Generar URL (no firmada, asumiendo bucket público o con políticas)
            s3_url = f"https://{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"
            
            logger.info(f"✅ Archivo subido a S3: {s3_key}")
            
            return {
                's3Key': s3_key,
                's3Url': s3_url
            }
            
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            logger.error(f"❌ Error al subir a S3 ({error_code}): {e}")
            
            if error_code == 'NoSuchBucket':
                raise Exception(f"Bucket de S3 no existe: {self.bucket_name}")
            elif error_code == 'AccessDenied':
                raise Exception("Acceso denegado a S3. Verifique las credenciales y permisos.")
            elif error_code == 'InvalidAccessKeyId':
                raise Exception("Credenciales de AWS inválidas")
            else:
                raise Exception(f"Error al subir archivo a S3: {str(e)}")
        except Exception as e:
            logger.error(f"❌ Error inesperado al subir a S3: {e}")
            raise
    
    def delete_file(self, s3_key: str) -> bool:
        """
        Eliminar archivo de S3
        
        Args:
            s3_key: Key del archivo en S3
            
        Returns:
            True si se eliminó exitosamente
        """
        if not self.client:
            raise ValueError("S3 no está configurado")
        
        try:
            self.client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            logger.info(f"✅ Archivo eliminado de S3: {s3_key}")
            return True
            
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            logger.error(f"❌ Error al eliminar de S3 ({error_code}): {e}")
            
            if error_code == 'NoSuchKey':
                logger.warning(f"⚠️ Archivo no existe en S3: {s3_key}")
                return True  # Consider it deleted if it doesn't exist
            return False
        except Exception as e:
            logger.error(f"❌ Error inesperado al eliminar de S3: {e}")
            return False
    
    def generate_presigned_url(self, s3_key: str, expiration: int = 3600) -> str:
        """
        Generar URL firmada para acceso temporal
        
        Args:
            s3_key: Key del archivo en S3
            expiration: Tiempo de expiración en segundos (default: 1 hora)
            
        Returns:
            URL firmada
        """
        if not self.client:
            raise ValueError("S3 no está configurado")
        
        try:
            url = self.client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': s3_key
                },
                ExpiresIn=expiration
            )
            return url
            
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            logger.error(f"❌ Error al generar URL firmada ({error_code}): {e}")
            
            if error_code == 'NoSuchKey':
                raise Exception(f"Archivo no encontrado en S3: {s3_key}")
            elif error_code == 'AccessDenied':
                raise Exception("Acceso denegado para generar URL firmada")
            else:
                raise Exception(f"Error al generar URL firmada: {str(e)}")
        except Exception as e:
            logger.error(f"❌ Error inesperado al generar URL firmada: {e}")
            raise
