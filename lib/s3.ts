import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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
      // Note: ACL removed - bucket uses bucket policy for public access
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

export interface GetPresignedUrlParams {
  s3Key: string;
  bucketName?: string;
  expiresIn?: number; // seconds
}

/**
 * Generate a pre-signed URL for temporary access to a private S3 object
 */
export async function getPresignedDownloadUrl({
  s3Key,
  bucketName = process.env.AWS_S3_BUCKET_NAME || 'invoices-bucket',
  expiresIn = 3600, // 1 hour default
}: GetPresignedUrlParams): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    
    console.log('✅ Generated pre-signed URL for:', s3Key);
    return signedUrl;

  } catch (error) {
    console.error('❌ Error generating pre-signed URL:', error);
    throw new Error(`Failed to generate pre-signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
