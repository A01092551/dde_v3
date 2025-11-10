import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Factura from '@/lib/models/Factura';
import mongoose from 'mongoose';

// GET /api/invoices/:id - Obtener una factura específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;

    // Validar formato de ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID de factura inválido' },
        { status: 400 }
      );
    }

    const factura = await Factura.findById(id).lean();

    if (!factura) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        ...factura,
        _links: {
          self: `/api/invoices/${id}`,
          collection: '/api/invoices',
        },
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error al obtener factura:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener la factura',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// PUT /api/invoices/:id - Actualizar una factura completa
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;

    // Validar formato de ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID de factura inválido' },
        { status: 400 }
      );
    }

    const data = await request.json();

    // Actualizar timestamp
    data.updatedAt = new Date();

    const factura = await Factura.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    );

    if (!factura) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'Factura actualizada exitosamente',
        data: factura,
        _links: {
          self: `/api/invoices/${id}`,
          collection: '/api/invoices',
        },
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error al actualizar factura:', error);
    
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
        error: 'Error al actualizar la factura',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// PATCH /api/invoices/:id - Actualizar parcialmente una factura
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;

    // Validar formato de ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID de factura inválido' },
        { status: 400 }
      );
    }

    const updates = await request.json();

    // Actualizar timestamp
    updates.updatedAt = new Date();

    const factura = await Factura.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!factura) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'Factura actualizada exitosamente',
        data: factura,
        _links: {
          self: `/api/invoices/${id}`,
          collection: '/api/invoices',
        },
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error al actualizar factura:', error);
    
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
        error: 'Error al actualizar la factura',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/invoices/:id - Eliminar una factura
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;

    // Validar formato de ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID de factura inválido' },
        { status: 400 }
      );
    }

    const factura = await Factura.findByIdAndDelete(id);

    if (!factura) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'Factura eliminada exitosamente',
        id: factura._id.toString(),
        numeroFactura: factura.numeroFactura,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error al eliminar factura:', error);
    return NextResponse.json(
      { 
        error: 'Error al eliminar la factura',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
