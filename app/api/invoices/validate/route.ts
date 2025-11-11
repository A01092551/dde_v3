import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Factura from '@/lib/models/Factura';
import { uploadToS3 } from '@/lib/s3';

// Connect to MongoDB
async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Receiving validation request with file upload...');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const dataString = formData.get('data') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!dataString) {
      return NextResponse.json(
        { error: 'No invoice data provided' },
        { status: 400 }
      );
    }

    const data = JSON.parse(dataString);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to S3
    console.log('📤 Uploading file to S3...');
    const s3Url = await uploadToS3({
      file: buffer,
      fileName: file.name,
      mimeType: file.type,
    });

    console.log('✅ File uploaded to S3:', s3Url);

    // Connect to database
    await connectDB();

    // Check for duplicates
    if (data.numeroFactura) {
      const existing = await Factura.findOne({ numeroFactura: data.numeroFactura });
      if (existing) {
        return NextResponse.json(
          {
            error: 'Factura duplicada',
            message: `Ya existe una factura con el número ${data.numeroFactura}`,
            facturaId: existing._id.toString(),
          },
          { status: 409 }
        );
      }
    }

    // Add S3 URL and validation metadata
    const invoiceData = {
      ...data,
      metadata: {
        ...data.metadata,
        s3Url,
        s3Key: s3Url.split('.com/')[1], // Extract the key from URL
        validatedAt: new Date().toISOString(),
        validatedBy: 'user', // You can add actual user ID here
      },
    };

    // Save to MongoDB
    const factura = new Factura(invoiceData);
    await factura.save();

    console.log('✅ Invoice saved to database with ID:', factura._id);

    return NextResponse.json(
      {
        success: true,
        message: 'Factura validada y guardada exitosamente',
        id: factura._id.toString(),
        numeroFactura: factura.numeroFactura,
        s3Url,
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('❌ Error validating invoice:', error);

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
        error: 'Error al validar la factura',
        message: error.message,
      },
      { status: 500 }
    );
  }
}