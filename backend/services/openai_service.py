from openai import OpenAI
from config import settings
import json
import re
import logging
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
        """Extraer datos de un PDF usando Assistants API"""
        logger.info(f"📄 Procesando PDF: {filename}")
        
        try:
            # Subir archivo a OpenAI
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
            
            response_text = assistant_message.content[0].text.value
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
        """Parsear respuesta JSON de OpenAI"""
        try:
            # Intentar encontrar JSON en bloques de código
            json_match = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', response_text)
            json_string = json_match.group(1) if json_match else None
            
            # Si no se encuentra en bloques, buscar JSON directo
            if not json_string:
                json_match = re.search(r'\{[\s\S]*\}', response_text)
                json_string = json_match.group(0) if json_match else None
            
            if not json_string:
                raise ValueError('No se pudo encontrar JSON en la respuesta')
            
            # Limpiar y parsear
            cleaned_json = json_string.replace(',}', '}').replace(',]', ']')
            return json.loads(cleaned_json)
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ Error al parsear JSON: {e}")
            logger.error(f"Respuesta: {response_text}")
            raise ValueError(f'No se pudo parsear el JSON: {e}')
