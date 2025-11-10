import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import connectDB from '@/lib/mongoose';
import Factura from '@/lib/models/Factura';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// GET /api/invoices - Listar facturas con paginación y búsqueda
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    const numeroFactura = searchParams.get('numero') || searchParams.get('numeroFactura');

    // Construir query
    const query: any = {};
    if (numeroFactura) {
      query.numeroFactura = { $regex: numeroFactura, $options: 'i' };
    }

    // Ejecutar consulta
    const facturas = await Factura.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await Factura.countDocuments(query);

    return NextResponse.json({
      data: facturas,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
      _links: {
        self: `/api/invoices?limit=${limit}&skip=${skip}${numeroFactura ? `&numero=${numeroFactura}` : ''}`,
        next: skip + limit < total ? `/api/invoices?limit=${limit}&skip=${skip + limit}${numeroFactura ? `&numero=${numeroFactura}` : ''}` : null,
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error al obtener facturas:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener facturas',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Crear/procesar nueva factura
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // Caso 1: Subir archivo para extracción (multipart/form-data)
    if (contentType.includes('multipart/form-data')) {
      return await extractInvoice(request);
    }

    // Caso 2: Guardar factura ya extraída (application/json)
    if (contentType.includes('application/json')) {
      return await saveInvoice(request);
    }

    return NextResponse.json(
      { error: 'Content-Type no soportado. Use multipart/form-data o application/json' },
      { status: 415 } // Unsupported Media Type
    );

  } catch (error: any) {
    console.error('Error en POST /api/invoices:', error);
    return NextResponse.json(
      { 
        error: 'Error al procesar la solicitud',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// Función auxiliar: Extraer datos de factura
async function extractInvoice(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type;
    const fileName = file.name;

    let extractedData;

    // Procesar según tipo de archivo
    if (mimeType === 'application/pdf') {
      // Usar Assistants API para PDFs
      const uploadedFile = await openai.files.create({
        file: new File([buffer], fileName, { type: mimeType }),
        purpose: 'assistants',
      });

      const assistant = await openai.beta.assistants.create({
        name: 'Invoice Extractor',
        instructions: `Eres un experto en extracción de datos de facturas. Extrae TODOS los campos posibles de la factura y devuélvelos en formato JSON estructurado.

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
- observaciones: notas adicionales`,
        model: 'gpt-4o',
        tools: [{ type: 'file_search' }],
      });

      const thread = await openai.beta.threads.create({
        messages: [
          {
            role: 'user',
            content: 'Extrae todos los datos de esta factura en formato JSON.',
            attachments: [
              { file_id: uploadedFile.id, tools: [{ type: 'file_search' }] },
            ],
          },
        ],
      });

      const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
        assistant_id: assistant.id,
      });

      if (run.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(thread.id);
        const lastMessage = messages.data[0];
        
        if (lastMessage.content[0].type === 'text') {
          const responseText = lastMessage.content[0].text.value;
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          
          if (jsonMatch) {
            extractedData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No se pudo extraer JSON de la respuesta');
          }
        }
      }

      // Limpiar recursos
      await openai.files.del(uploadedFile.id);
      await openai.beta.assistants.del(assistant.id);

    } else if (mimeType.startsWith('image/')) {
      // Usar Vision API para imágenes
      const base64Image = buffer.toString('base64');

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extrae TODOS los datos de esta factura y devuélvelos en formato JSON con esta estructura:
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
}`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
      });

      const responseText = response.choices[0].message.content || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No se pudo extraer JSON de la respuesta');
      }

    } else {
      return NextResponse.json(
        { error: 'Tipo de archivo no soportado. Use PDF o imagen.' },
        { status: 400 }
      );
    }

    // Agregar metadata
    const result = {
      ...extractedData,
      metadata: {
        fileName,
        fileSize: buffer.length,
        mimeType,
        processedAt: new Date().toISOString(),
        model: 'gpt-4o',
      },
    };

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('Error al extraer factura:', error);
    return NextResponse.json(
      { 
        error: 'Error al extraer datos de la factura',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// Función auxiliar: Guardar factura en MongoDB
async function saveInvoice(request: NextRequest) {
  try {
    await connectDB();

    const data = await request.json();

    // Validar campos requeridos
    if (!data.metadata?.fileName || !data.metadata?.processedAt) {
      return NextResponse.json(
        { 
          error: 'Datos incompletos',
          message: 'Se requieren metadata.fileName y metadata.processedAt'
        },
        { status: 400 }
      );
    }

    // Verificar duplicados
    if (data.numeroFactura) {
      const existing = await Factura.findOne({ numeroFactura: data.numeroFactura });
      if (existing) {
        return NextResponse.json(
          {
            error: 'Factura duplicada',
            message: `Ya existe una factura con el número ${data.numeroFactura}`,
            facturaId: existing._id.toString(),
          },
          { status: 409 } // Conflict
        );
      }
    }

    // Agregar timestamp de validación
    data.metadata.validatedAt = new Date().toISOString();

    // Guardar en MongoDB
    const factura = new Factura(data);
    await factura.save();

    return NextResponse.json(
      {
        message: 'Factura creada exitosamente',
        id: factura._id.toString(),
        numeroFactura: factura.numeroFactura,
        _links: {
          self: `/api/invoices/${factura._id}`,
          collection: '/api/invoices',
        },
      },
      { 
        status: 201, // Created
        headers: {
          'Location': `/api/invoices/${factura._id}`,
        },
      }
    );

  } catch (error: any) {
    console.error('Error al guardar factura:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        {
          error: 'Error de validación',
          details: Object.values(error.errors).map((e: any) => e.message),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Error al guardar la factura',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
