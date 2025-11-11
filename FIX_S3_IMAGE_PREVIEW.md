# 🖼️ Fix: S3 Image Preview Not Working

## ❌ Problem
Images and PDFs from Amazon S3 are not displaying in the invoice drawer preview.

---

## 🔍 Root Cause

The S3 objects were uploaded **without public read permissions**, making them inaccessible to browsers via direct URL.

### **Code Issue:**
```typescript
// ❌ BEFORE (line 37 in lib/s3.ts)
// ACL: 'public-read',  // Commented out!
```

When `ACL: 'public-read'` is commented out, S3 objects default to **private**, requiring authentication to access.

---

## ✅ Solution Applied

### **Option 1: Public Read ACL (Implemented)**

Uncommented the `ACL: 'public-read'` parameter:

```typescript
// ✅ AFTER
const command = new PutObjectCommand({
  Bucket: bucketName,
  Key: key,
  Body: file,
  ContentType: mimeType,
  ACL: 'public-read',  // Now enabled!
});
```

---

## 🔧 Additional Requirements

### **1. S3 Bucket Configuration**

Your S3 bucket must allow public ACLs. Check these settings:

#### **A. Block Public Access Settings**
In AWS Console → S3 → Your Bucket → Permissions → Block public access:

```
❌ Block all public access: OFF
  ❌ Block public access to buckets and objects granted through new access control lists (ACLs): OFF
  ❌ Block public access to buckets and objects granted through any access control lists (ACLs): OFF
  ✅ Block public access to buckets and objects granted through new public bucket or access point policies: ON
  ✅ Block public and cross-account access to buckets and objects through any public bucket or access point policies: ON
```

#### **B. Object Ownership**
In AWS Console → S3 → Your Bucket → Permissions → Object Ownership:

```
✅ ACLs enabled
✅ Bucket owner preferred
```

### **2. CORS Configuration**

Add CORS rules to allow browser access:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://yourdomain.com"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

**How to add:**
1. Go to AWS Console → S3 → Your Bucket
2. Click "Permissions" tab
3. Scroll to "Cross-origin resource sharing (CORS)"
4. Click "Edit"
5. Paste the JSON above
6. Click "Save changes"

### **3. Bucket Policy (Optional)**

If you want all objects public by default:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

Replace `YOUR-BUCKET-NAME` with your actual bucket name.

---

## 🔄 For Existing Files

### **Problem:**
Files uploaded **before** this fix are still private.

### **Solution:**
Update existing objects to be public:

#### **Option A: AWS CLI (Bulk Update)**
```bash
aws s3 cp s3://YOUR-BUCKET-NAME/invoices/ s3://YOUR-BUCKET-NAME/invoices/ \
  --recursive \
  --acl public-read \
  --metadata-directive REPLACE
```

#### **Option B: AWS Console (Manual)**
1. Go to S3 bucket
2. Select files
3. Actions → Make public using ACL
4. Confirm

#### **Option C: Node.js Script**
Create `scripts/make-s3-public.js`:

```javascript
const { S3Client, PutObjectAclCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function makePublic() {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  
  // List all objects
  const listCommand = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: 'invoices/',
  });
  
  const { Contents } = await s3Client.send(listCommand);
  
  // Make each object public
  for (const object of Contents || []) {
    const aclCommand = new PutObjectAclCommand({
      Bucket: bucketName,
      Key: object.Key,
      ACL: 'public-read',
    });
    
    await s3Client.send(aclCommand);
    console.log(`✅ Made public: ${object.Key}`);
  }
  
  console.log('✅ All files are now public!');
}

makePublic().catch(console.error);
```

Run with:
```bash
node scripts/make-s3-public.js
```

---

## 🔒 Alternative: Signed URLs (More Secure)

If you don't want public files, use **pre-signed URLs** instead:

### **1. Update S3 Upload (Keep Private)**
```typescript
// lib/s3.ts - Remove ACL
const command = new PutObjectCommand({
  Bucket: bucketName,
  Key: key,
  Body: file,
  ContentType: mimeType,
  // No ACL - files stay private
});
```

### **2. Generate Signed URLs**
```typescript
// lib/s3.ts - Add new function
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function getSignedS3Url(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
  });
  
  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
  return signedUrl;
}
```

### **3. Update API to Return Signed URLs**
```typescript
// app/api/invoices/route.ts
import { getSignedS3Url } from '@/lib/s3';

// In GET endpoint
const facturas = await Factura.find().lean();

// Add signed URLs
const facturasWithSignedUrls = await Promise.all(
  facturas.map(async (factura) => {
    if (factura.metadata.s3Key) {
      const signedUrl = await getSignedS3Url(factura.metadata.s3Key);
      return {
        ...factura,
        metadata: {
          ...factura.metadata,
          s3Url: signedUrl, // Replace with signed URL
        },
      };
    }
    return factura;
  })
);

return NextResponse.json(facturasWithSignedUrls);
```

**Pros:**
- ✅ Files stay private
- ✅ Time-limited access
- ✅ More secure

**Cons:**
- ❌ URLs expire (need regeneration)
- ❌ More complex
- ❌ Slower (API call needed)

---

## 🧪 Testing

### **1. Upload New Invoice**
1. Go to `/extraccion`
2. Upload an image invoice
3. Validate and save
4. Go to `/facturas`
5. Click the invoice
6. **Image should now display!** ✅

### **2. Check Browser Console**
If still not working, open browser DevTools (F12):

```javascript
// Check for CORS errors
// ❌ Bad:
Access to image at 'https://bucket.s3.amazonaws.com/...' 
has been blocked by CORS policy

// ❌ Bad:
403 Forbidden

// ✅ Good:
200 OK
```

### **3. Test S3 URL Directly**
Copy the S3 URL from the invoice and paste in browser:
- ✅ Should display image/PDF
- ❌ If 403 error → ACL not set or bucket not configured

---

## 📋 Checklist

- [x] Uncommented `ACL: 'public-read'` in `lib/s3.ts`
- [ ] Configure S3 bucket to allow public ACLs
- [ ] Add CORS configuration to S3 bucket
- [ ] Update existing files to be public (if needed)
- [ ] Test with new upload
- [ ] Verify in browser DevTools

---

## 🎯 Quick Fix Summary

### **What Was Wrong:**
```typescript
// ACL: 'public-read',  // ❌ Commented out
```

### **What's Fixed:**
```typescript
ACL: 'public-read',  // ✅ Now enabled
```

### **What You Need to Do:**
1. ✅ Code is already fixed
2. ⚠️ Configure S3 bucket (see above)
3. ⚠️ Add CORS rules (see above)
4. ⚠️ Update existing files (optional)

---

## 🚨 Important Notes

### **Security Consideration:**
Making files public means **anyone with the URL** can access them. If invoices contain sensitive data:

1. **Use signed URLs** (see alternative above)
2. **Add authentication** to S3 URLs
3. **Use CloudFront** with signed cookies
4. **Implement access control** in your app

### **Cost Consideration:**
Public files are subject to S3 data transfer charges. Monitor your AWS bill.

---

## 📚 AWS Documentation

- [S3 ACLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/acl-overview.html)
- [S3 CORS](https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html)
- [Pre-signed URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ShareObjectPreSignedURL.html)

---

## ✅ Result

After applying this fix and configuring S3:
- ✅ Images display in drawer
- ✅ PDFs load in iframe
- ✅ New uploads work automatically
- ✅ Direct S3 URLs accessible

Preview should work perfectly now! 🎉
