import { NextRequest, NextResponse } from 'next/server';
import { getPresignedDownloadUrl } from '@/lib/s3';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const s3Key = searchParams.get('key');

    if (!s3Key) {
      return NextResponse.json(
        { error: 'S3 key is required' },
        { status: 400 }
      );
    }

    // Generate pre-signed URL valid for 1 hour
    const signedUrl = await getPresignedDownloadUrl({
      s3Key,
      expiresIn: 3600,
    });

    return NextResponse.json({
      success: true,
      url: signedUrl,
    });

  } catch (error: any) {
    console.error('❌ Error generating signed URL:', error);
    return NextResponse.json(
      {
        error: 'Error generating image URL',
        message: error.message,
      },
      { status: 500 }
    );
  }
}