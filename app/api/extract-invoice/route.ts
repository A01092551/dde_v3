import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Inicializar cliente de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  let uploadedFileId: string | null = null;
  let assistantId: string | null = null;
  let threadId: string | null = null;

  try {
    console.log('📥 Iniciando procesamiento de factura...');
    
    // Obtener el archivo del FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('❌ No se proporcionó archivo');
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    console.log(`📄 Archivo recibido: ${file.name} (${file.size} bytes, tipo: ${file.type})`);

    // Validar que sea un PDF o imagen
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      console.error('❌ Tipo de archivo inválido:', file.type);
      return NextResponse.json(
        { error: 'El archivo debe ser un PDF o una imagen (PNG, JPG, WEBP)' },
        { status: 400 }
      );
    }

    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    let content: string | null = null;

    // Procesar según el tipo de archivo
    if (isPdf) {
      // Para PDFs: usar Assistants API
      console.log('📤 Subiendo PDF a OpenAI...');
      
      const fileForUpload = new File([buffer], file.name, { type: 'application/pdf' });
      
      const uploadedFile = await openai.files.create({
        file: fileForUpload,
        purpose: 'assistants'
      });
      
      uploadedFileId = uploadedFile.id;
      console.log(`✅ Archivo subido a OpenAI: ${uploadedFileId}`);

      console.log('🤖 Creando asistente de OpenAI...');
      const assistant = await openai.beta.assistants.create({
        name: 'Extractor de Facturas',
        instructions: `Eres un asistente experto en extraer información de facturas. 
Analiza el PDF de la factura y extrae toda la información relevante en formato JSON estructurado.

Incluye los siguientes campos si están disponibles:
- numeroFactura: número de la factura
- fecha: fecha de emisión
- fechaVencimiento: fecha de vencimiento (si aplica)
- proveedor: información del proveedor (nombre, RFC/NIT, dirección, teléfono)
- cliente: información del cliente (nombre, RFC/NIT, dirección)
- items: array de productos/servicios con descripcion, cantidad, precioUnitario, total
- subtotal: subtotal antes de impuestos
- iva: monto del IVA u otros impuestos
- total: total a pagar
- moneda: moneda utilizada
- formaPago: forma de pago
- metodoPago: método de pago
- usoCFDI: uso del CFDI (si aplica)
- observaciones: notas adicionales

Devuelve SOLO el JSON sin texto adicional.`,
        model: 'gpt-4o',
        tools: [{ type: 'file_search' }]
      });
      
      assistantId = assistant.id;
      console.log(`✅ Asistente creado: ${assistantId}`);

      console.log('💬 Creando conversación...');
      const thread = await openai.beta.threads.create({
        messages: [
          {
            role: 'user',
            content: 'Analiza esta factura y extrae toda la información en formato JSON.',
            attachments: [
              {
                file_id: uploadedFileId,
                tools: [{ type: 'file_search' }]
              }
            ]
          }
        ]
      });
      
      threadId = thread.id;
      console.log(`✅ Conversación creada: ${threadId}`);

      console.log('⚙️ Procesando factura...');
      const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
        assistant_id: assistant.id
      });

      console.log(`✅ Procesamiento completado: ${run.status}`);

      if (run.status !== 'completed') {
        throw new Error(`El asistente no completó el procesamiento: ${run.status}`);
      }

      const messages = await openai.beta.threads.messages.list(thread.id);
      const assistantMessage = messages.data.find(m => m.role === 'assistant');
      
      if (!assistantMessage || !assistantMessage.content[0]) {
        throw new Error('No se recibió respuesta del asistente');
      }

      content = assistantMessage.content[0].type === 'text' 
        ? assistantMessage.content[0].text.value 
        : null;

    } else if (isImage) {
      // Para imágenes: usar Vision API directamente
      console.log('🖼️ Procesando imagen con Vision API...');
      
      const base64Image = buffer.toString('base64');
      const mimeType = file.type;

      const prompt = `Analiza la siguiente imagen de una factura y extrae toda la información relevante en formato JSON estructurado.

Incluye los siguientes campos si están disponibles:
- numeroFactura: número de la factura
- fecha: fecha de emisión
- fechaVencimiento: fecha de vencimiento (si aplica)
- proveedor: información del proveedor (nombre, RFC/NIT, dirección, teléfono)
- cliente: información del cliente (nombre, RFC/NIT, dirección)
- items: array de productos/servicios con descripcion, cantidad, precioUnitario, total
- subtotal: subtotal antes de impuestos
- iva: monto del IVA u otros impuestos
- total: total a pagar
- moneda: moneda utilizada
- formaPago: forma de pago
- metodoPago: método de pago
- usoCFDI: uso del CFDI (si aplica para facturas mexicanas)
- observaciones: cualquier nota u observación adicional

Devuelve SOLO el JSON sin texto adicional. Si algún campo no está disponible, omítelo o usa null.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente experto en extraer información de facturas. Devuelves siempre JSON válido y estructurado.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      });

      console.log('✅ Respuesta recibida de Vision API');
      content = response.choices[0]?.message?.content || null;
    }

    if (!content) {
      throw new Error('No se recibió respuesta de OpenAI');
    }

    // Intentar parsear el JSON de la respuesta
    let extractedData;
    try {
      // Limpiar la respuesta en caso de que tenga markdown
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      extractedData = JSON.parse(cleanContent);
    } catch (parseError) {
      // Si no se puede parsear, devolver el contenido como texto
      extractedData = {
        rawResponse: content,
        error: 'No se pudo parsear la respuesta como JSON'
      };
    }

    // Agregar metadata
    const finalResult = {
      ...extractedData,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        processedAt: new Date().toISOString(),
        model: 'gpt-4o'
      }
    };

    console.log('✅ Procesamiento completado exitosamente');
    
    // Limpiar recursos de OpenAI (solo para PDFs que usan Assistants API)
    if (isPdf) {
      try {
        if (threadId) {
          await openai.beta.threads.del(threadId);
          console.log('🧹 Thread eliminado');
        }
        if (assistantId) {
          await openai.beta.assistants.del(assistantId);
          console.log('🧹 Asistente eliminado');
        }
        if (uploadedFileId) {
          await openai.files.del(uploadedFileId);
          console.log('🧹 Archivo eliminado');
        }
      } catch (cleanupError) {
        console.error('⚠️ Error al limpiar recursos:', cleanupError);
      }
    }
    
    return NextResponse.json(finalResult);

  } catch (error) {
    console.error('❌ Error al procesar la factura:', error);
    
    // Log detallado del error
    if (error instanceof Error) {
      console.error('   Mensaje:', error.message);
      console.error('   Stack:', error.stack);
    }
    
    return NextResponse.json(
      {
        error: 'Error al procesar la factura',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
