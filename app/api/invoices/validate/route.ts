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
  const requestStartTime = Date.now();
  
  try {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ [BACKEND] VALIDATION API ENDPOINT CALLED');
    console.log('═══════════════════════════════════════════════════════');
    console.log('⏰ Request received at:', new Date().toISOString());
    console.log('🌐 Request method:', request.method);
    console.log('🔗 Request URL:', request.url);

    console.log('\n📦 [BACKEND] Parsing FormData...');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const dataString = formData.get('data') as string;

    if (!file) {
      console.log('❌ [BACKEND] No file provided');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!dataString) {
      console.log('❌ [BACKEND] No invoice data provided');
      return NextResponse.json(
        { error: 'No invoice data provided' },
        { status: 400 }
      );
    }

    console.log('✅ [BACKEND] FormData parsed successfully');
    console.log('   → File:', file.name, '(', (file.size / 1024).toFixed(2), 'KB)');
    console.log('   → Data size:', dataString.length, 'characters');

    const data = JSON.parse(dataString);
    console.log('   → Invoice number:', data.numeroFactura || 'N/A');

    // Convert file to buffer
    console.log('\n💾 [BACKEND] Converting file to buffer...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log('✅ [BACKEND] File converted to buffer');

    // Upload to S3
    console.log('\n📤 [BACKEND] Uploading file to S3...');
    const s3StartTime = Date.now();
    const s3Url = await uploadToS3({
      file: buffer,
      fileName: file.name,
      mimeType: file.type,
    });
    const s3Duration = Date.now() - s3StartTime;

    console.log('✅ [BACKEND] File uploaded to S3 in', s3Duration, 'ms');
    console.log('   → S3 URL:', s3Url);

    // Connect to database
    console.log('\n🗄️  [BACKEND] Connecting to MongoDB...');
    const dbStartTime = Date.now();
    await connectDB();
    const dbConnectDuration = Date.now() - dbStartTime;
    console.log('✅ [BACKEND] Connected to MongoDB in', dbConnectDuration, 'ms');

    // Check for duplicates
    console.log('\n🔍 [BACKEND] Checking for duplicate invoices...');
    if (data.numeroFactura) {
      console.log('   → Searching for invoice number:', data.numeroFactura);
      const duplicateCheckStart = Date.now();
      const existing = await Factura.findOne({ numeroFactura: data.numeroFactura });
      const duplicateCheckDuration = Date.now() - duplicateCheckStart;
      console.log('   → Duplicate check completed in', duplicateCheckDuration, 'ms');
      
      if (existing) {
        console.log('   ❌ [BACKEND] Duplicate invoice found!');
        console.log('      → Existing invoice ID:', existing._id.toString());
        console.log('      → Created at:', existing.createdAt);
        return NextResponse.json(
          {
            error: 'Factura duplicada',
            message: `Ya existe una factura con el número ${data.numeroFactura}`,
            facturaId: existing._id.toString(),
          },
          { status: 409 }
        );
      }
      console.log('   ✅ [BACKEND] No duplicate found');
    } else {
      console.log('   ⚠️  [BACKEND] No invoice number provided, skipping duplicate check');
    }

    // Add S3 URL and validation metadata
    console.log('\n📦 [BACKEND] Preparing invoice data for database...');
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
    console.log('✅ [BACKEND] Invoice data prepared');

    // Save to MongoDB
    console.log('\n💾 [BACKEND] Saving invoice to MongoDB...');
    const saveStartTime = Date.now();
    const factura = new Factura(invoiceData);
    await factura.save();
    const saveDuration = Date.now() - saveStartTime;

    console.log('✅ [BACKEND] Invoice saved to database in', saveDuration, 'ms');
    console.log('   → Invoice ID:', factura._id.toString());
    console.log('   → Invoice number:', factura.numeroFactura);
    console.log('   → S3 URL:', s3Url);

    const totalDuration = Date.now() - requestStartTime;
    console.log('\n⏱️  [BACKEND] Total request duration:', totalDuration, 'ms');
    console.log('📤 [BACKEND] Sending success response...');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ [BACKEND] VALIDATION COMPLETED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════\n');

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
    const totalDuration = Date.now() - requestStartTime;
    console.log('\n═══════════════════════════════════════════════════════');
    console.error('❌ [BACKEND] VALIDATION FAILED');
    console.log('═══════════════════════════════════════════════════════');
    console.error('💥 Error details:', error);
    console.error('   → Error type:', error.name);
    console.error('   → Error message:', error.message);
    console.error('   → Request duration before failure:', totalDuration, 'ms');

    if (error.name === 'ValidationError') {
      console.error('   → Validation errors:', Object.keys(error.errors));
      return NextResponse.json(
        {
          error: 'Error de validación',
          details: Object.values(error.errors).map((e: any) => e.message),
        },
        { status: 400 }
      );
    }

    if (error.stack) {
      console.error('   → Stack trace:', error.stack);
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