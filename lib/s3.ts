import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export interface UploadToS3Params {
  file: Buffer;
  fileName: string;
  mimeType: string;
  bucketName?: string;
}

export async function uploadToS3({
  file,
  fileName,
  mimeType,
  bucketName = process.env.AWS_S3_BUCKET_NAME || 'invoices-bucket',
}: UploadToS3Params): Promise<string> {
  try {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `invoices/${timestamp}-${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file,
      ContentType: mimeType,
      // Make file publicly readable (optional, remove if you want private files)
      // ACL: 'public-read',
    });

    await s3Client.send(command);

    // Return the S3 URL
    const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    
    console.log('✅ File uploaded to S3:', s3Url);
    return s3Url;

  } catch (error) {
    console.error('❌ Error uploading to S3:', error);
    throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
