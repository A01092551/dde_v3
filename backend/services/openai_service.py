from openai import OpenAI
from config import settings
import json
import re
import logging
import os
from typing import Dict, Any

logger = logging.getLogger(__name__)

class OpenAIService:
    def __init__(self):
        self.client = OpenAI(
            api_key=settings.OPENAI_API_KEY,
            max_retries=2,
            timeout=60.0
        )
    
    async def extract_from_pdf(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """Extraer datos de un PDF - detecta si es imagen y usa Vision API"""
        logger.info(f"📄 Procesando PDF: {filename}")
        
        try:
            # Intentar convertir PDF a imagen (para PDFs que son solo imágenes)
            from pdf2image import pdfinfo_from_bytes, convert_from_bytes
            import base64
            
            logger.info("🔍 Detectando tipo de PDF...")
            
            try:
                # Configurar path de Poppler para Windows
                poppler_path = None
                if os.name == 'nt':  # Windows
                    # Intentar obtener de variable de entorno primero
                    poppler_path = os.environ.get('POPPLER_PATH')
                    # Si no existe, usar ruta común de instalación
                    if not poppler_path:
                        common_paths = [
                            r'C:\poppler-25.11.0\Library\bin',
                            r'C:\Program Files\poppler\Library\bin',
                            r'C:\poppler\Library\bin',
                        ]
                        for path in common_paths:
                            if os.path.exists(path):
                                poppler_path = path
                                logger.info(f"✅ Poppler encontrado en: {poppler_path}")
                                break
                
                # Convertir primera página del PDF a imagen
                if poppler_path:
                    images = convert_from_bytes(file_content, first_page=1, last_page=1, poppler_path=poppler_path)
                else:
                    images = convert_from_bytes(file_content, first_page=1, last_page=1)
                
                if images:
                    logger.info("📸 PDF detectado como imagen - usando Vision API")
                    
                    # Convertir imagen a bytes
                    import io
                    img_byte_arr = io.BytesIO()
                    images[0].save(img_byte_arr, format='PNG')
                    img_byte_arr = img_byte_arr.getvalue()
                    
                    # Usar Vision API en lugar de Assistants
                    base64_image = base64.b64encode(img_byte_arr).decode('utf-8')
                    
                    logger.info("📤 Enviando a Vision API...")
                    response = self.client.chat.completions.create(
                        model='gpt-4o',
                        messages=[
                            {
                                'role': 'user',
                                'content': [
                                    {
                                        'type': 'text',
                                        'text': self._get_vision_prompt()
                                    },
                                    {
                                        'type': 'image_url',
                                        'image_url': {
                                            'url': f'data:image/png;base64,{base64_image}'
                                        }
                                    }
                                ]
                            }
                        ],
                        max_tokens=2000
                    )
                    
                    logger.info("✅ Respuesta recibida de Vision API")
                    response_text = response.choices[0].message.content
                    logger.info(f"📝 Respuesta (primeros 500 chars): {response_text[:500]}...")
                    extracted_data = self._parse_json_response(response_text)
                    
                    return extracted_data
                    
            except ImportError:
                logger.warning("⚠️  pdf2image no disponible - intentando con Assistants API")
                # Continuar con el método original si pdf2image no está instalado
            except Exception as pdf_error:
                logger.warning(f"⚠️  No se pudo convertir PDF a imagen: {pdf_error}")
                logger.info("🔄 Intentando con Assistants API...")
            
            # Método original: Assistants API (para PDFs con texto real)
            logger.info("📤 Subiendo archivo a OpenAI...")
            uploaded_file = self.client.files.create(
                file=(filename, file_content),
                purpose='assistants'
            )
            logger.info(f"✅ Archivo subido: {uploaded_file.id}")
            
            # Crear asistente
            logger.info("🤖 Creando asistente...")
            assistant = self.client.beta.assistants.create(
                name='Invoice Extractor',
                instructions=self._get_extraction_instructions(),
                model='gpt-4o',
                tools=[{'type': 'file_search'}]
            )
            logger.info(f"✅ Asistente creado: {assistant.id}")
            
            # Crear thread con el archivo
            logger.info("💬 Creando conversación...")
            thread = self.client.beta.threads.create(
                messages=[
                    {
                        'role': 'user',
                        'content': 'Extrae todos los datos de esta factura en formato JSON.',
                        'attachments': [
                            {
                                'file_id': uploaded_file.id,
                                'tools': [{'type': 'file_search'}]
                            }
                        ]
                    }
                ]
            )
            logger.info(f"✅ Thread creado: {thread.id}")
            
            # Ejecutar asistente
            logger.info("⚙️ Procesando factura...")
            run = self.client.beta.threads.runs.create_and_poll(
                thread_id=thread.id,
                assistant_id=assistant.id
            )
            logger.info(f"✅ Procesamiento completado: {run.status}")
            
            if run.status != 'completed':
                raise Exception(f"El asistente no completó el procesamiento: {run.status}")
            
            # Obtener respuesta
            messages = self.client.beta.threads.messages.list(thread_id=thread.id)
            assistant_message = next((m for m in messages.data if m.role == 'assistant'), None)
            
            if not assistant_message or not assistant_message.content:
                raise Exception('No se recibió respuesta del asistente')
            
            # Construir texto completo de la respuesta (puede venir en múltiples partes)
            parts = []
            for part in assistant_message.content:
                if hasattr(part, "text") and part.text and hasattr(part.text, "value"):
                    parts.append(part.text.value)
            response_text = "\n".join(parts)
            
            logger.info(f"📝 Respuesta del asistente (primeros 500 chars): {response_text[:500]}...")
            extracted_data = self._parse_json_response(response_text)
            
            # Limpiar recursos
            logger.info("🧹 Limpiando recursos...")
            self.client.files.delete(uploaded_file.id)
            self.client.beta.assistants.delete(assistant.id)
            logger.info("✅ Recursos limpiados")
            
            return extracted_data
            
        except Exception as e:
            logger.error(f"❌ Error al procesar PDF: {e}")
            raise
    
    async def extract_from_image(self, file_content: bytes, mime_type: str) -> Dict[str, Any]:
        """Extraer datos de una imagen usando Vision API"""
        logger.info(f"🖼️ Procesando imagen: {mime_type}")
        
        try:
            import base64
            base64_image = base64.b64encode(file_content).decode('utf-8')
            
            logger.info("📤 Enviando a Vision API...")
            response = self.client.chat.completions.create(
                model='gpt-4o',
                messages=[
                    {
                        'role': 'user',
                        'content': [
                            {
                                'type': 'text',
                                'text': self._get_vision_prompt()
                            },
                            {
                                'type': 'image_url',
                                'image_url': {
                                    'url': f'data:{mime_type};base64,{base64_image}'
                                }
                            }
                        ]
                    }
                ],
                max_tokens=2000
            )
            
            logger.info("✅ Respuesta recibida de Vision API")
            response_text = response.choices[0].message.content
            extracted_data = self._parse_json_response(response_text)
            
            return extracted_data
            
        except Exception as e:
            logger.error(f"❌ Error al procesar imagen: {e}")
            raise
    
    def _get_extraction_instructions(self) -> str:
        """Instrucciones para el asistente"""
        return """Eres un experto en extracción de datos de facturas. Extrae TODOS los campos posibles de la factura y devuélvelos en formato JSON estructurado.

Campos a extraer:
- numeroFactura: número de la factura
- fecha: fecha de emisión (formato YYYY-MM-DD)
- fechaVencimiento: fecha de vencimiento (formato YYYY-MM-DD)
- proveedor: {nombre, rfc/nit, direccion, telefono}
- cliente: {nombre, rfc/nit, direccion}
- items: [{descripcion, cantidad, precioUnitario, total}]
- subtotal: subtotal antes de impuestos
- iva: monto del IVA
- total: monto total
- moneda: código de moneda (MXN, USD, etc.)
- formaPago: forma de pago
- metodoPago: método de pago
- usoCFDI: uso del CFDI (si aplica)
- observaciones: notas adicionales

Devuelve SOLO el JSON sin texto adicional."""
    
    def _get_vision_prompt(self) -> str:
        """Prompt para Vision API"""
        return """Extrae TODOS los datos de esta factura y devuélvelos en formato JSON con esta estructura:
{
  "numeroFactura": "string",
  "fecha": "YYYY-MM-DD",
  "fechaVencimiento": "YYYY-MM-DD",
  "proveedor": {"nombre": "string", "rfc": "string", "direccion": "string", "telefono": "string"},
  "cliente": {"nombre": "string", "rfc": "string", "direccion": "string"},
  "items": [{"descripcion": "string", "cantidad": number, "precioUnitario": number, "total": number}],
  "subtotal": number,
  "iva": number,
  "total": number,
  "moneda": "string",
  "formaPago": "string",
  "metodoPago": "string",
  "usoCFDI": "string",
  "observaciones": "string"
}

Devuelve SOLO el JSON sin texto adicional."""
    
    def _parse_json_response(self, response_text: str) -> Dict[str, Any]:
        """Parsear respuesta JSON de OpenAI de forma robusta"""
        try:
            # Estrategia 1: Intentar parsear el texto completo directamente
            try:
                return json.loads(response_text.strip())
            except json.JSONDecodeError:
                pass
            
            # Estrategia 2: Buscar JSON dentro de bloques de código ```json ... ```
            json_match = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', response_text)
            if json_match:
                json_string = json_match.group(1)
                logger.info("✅ JSON encontrado en bloque de código")
            else:
                # Estrategia 3: Buscar TODOS los bloques { ... } y tomar el más grande
                candidates = re.findall(r'\{[\s\S]*?\}', response_text)
                if candidates:
                    # Tomar el candidato más largo (probablemente el JSON completo)
                    json_string = max(candidates, key=len)
                    logger.info(f"✅ JSON encontrado como objeto directo (tamaño: {len(json_string)} chars)")
                else:
                    logger.error("❌ No se encontró ningún bloque que parezca JSON")
                    logger.error(f"Respuesta completa del asistente:\n{response_text}")
                    raise ValueError('No se pudo encontrar JSON en la respuesta')
            
            # Limpiar trailing commas (común en respuestas de IA)
            cleaned_json = json_string.replace(',}', '}').replace(',]', ']')
            
            # Intentar parsear
            parsed_data = json.loads(cleaned_json)
            logger.info(f"✅ JSON parseado exitosamente con {len(parsed_data)} campos")
            return parsed_data
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ Error al parsear JSON: {e}")
            logger.error(f"JSON candidato que falló:\n{json_string if 'json_string' in locals() else 'N/A'}")
            logger.error(f"Respuesta completa del asistente:\n{response_text}")
            raise ValueError(f'No se pudo parsear el JSON: {e}')
