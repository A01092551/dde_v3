import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Factura from '@/lib/models/Factura';

// Conectar a MongoDB
async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI no está definida en las variables de entorno');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Conectado a MongoDB');
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Recibiendo solicitud de validación...');

    // Obtener los datos del body
    const body = await request.json();
    
    if (!body) {
      return NextResponse.json(
        { error: 'No se proporcionaron datos' },
        { status: 400 }
      );
    }

    console.log('📄 Datos recibidos:', {
      numeroFactura: body.numeroFactura,
      fileName: body.metadata?.fileName
    });

    // Conectar a la base de datos
    await connectDB();

    // Verificar si ya existe una factura con el mismo número
    if (body.numeroFactura) {
      const existingFactura = await Factura.findOne({ 
        numeroFactura: body.numeroFactura 
      });

      if (existingFactura) {
        console.log('⚠️ Factura duplicada encontrada');
        return NextResponse.json(
          { 
            error: 'Ya existe una factura con este número',
            facturaId: existingFactura._id 
          },
          { status: 409 }
        );
      }
    }

    // Crear nueva factura
    const nuevaFactura = new Factura({
      ...body,
      metadata: {
        ...body.metadata,
        validatedAt: new Date(),
        validatedBy: 'user' // Aquí podrías poner el ID del usuario autenticado
      }
    });

    // Guardar en la base de datos
    const facturaGuardada = await nuevaFactura.save();
    console.log('✅ Factura guardada con ID:', facturaGuardada._id);

    return NextResponse.json({
      success: true,
      message: 'Factura validada y guardada exitosamente',
      facturaId: facturaGuardada._id,
      numeroFactura: facturaGuardada.numeroFactura
    });

  } catch (error) {
    console.error('❌ Error al validar factura:', error);
    
    // Manejar errores de validación de Mongoose
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        {
          error: 'Error de validación',
          details: Object.values(error.errors).map(e => e.message)
        },
        { status: 400 }
      );
    }

    // Manejar errores de conexión
    if (error instanceof mongoose.Error) {
      return NextResponse.json(
        {
          error: 'Error de base de datos',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Error al validar la factura',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// GET: Obtener todas las facturas validadas
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    const numeroFactura = searchParams.get('numeroFactura');

    // Construir query
    const query: any = {};
    if (numeroFactura) {
      query.numeroFactura = { $regex: numeroFactura, $options: 'i' };
    }

    // Obtener facturas
    const facturas = await Factura.find(query)
      .sort({ 'metadata.validatedAt': -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await Factura.countDocuments(query);

    return NextResponse.json({
      success: true,
      facturas,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener facturas:', error);
    
    return NextResponse.json(
      {
        error: 'Error al obtener facturas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
