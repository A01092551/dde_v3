# 🪣 S3 Bucket Policy Setup

## ✅ Issue Fixed in Code

The `ACL: 'public-read'` parameter has been removed from `lib/s3.ts` because your bucket doesn't support ACLs.

---

## 🔧 Configure S3 Bucket for Public Access

Your bucket is configured with **"ACLs disabled"** (recommended by AWS). To make files publicly accessible, you need to add a **bucket policy**.

---

## 📋 Step-by-Step Setup

### **Step 1: Go to S3 Bucket Settings**

1. Open [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Click on your bucket name
3. Go to the **"Permissions"** tab

---

### **Step 2: Edit Block Public Access**

Scroll to **"Block public access (bucket settings)"**:

1. Click **"Edit"**
2. **Uncheck** "Block all public access"
3. Specifically, uncheck:
   - ❌ Block public access to buckets and objects granted through new public bucket or access point policies
4. Click **"Save changes"**
5. Type `confirm` when prompted

---

### **Step 3: Add Bucket Policy**

Scroll to **"Bucket policy"**:

1. Click **"Edit"**
2. Paste this policy (replace `YOUR-BUCKET-NAME`):

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

**Important:** Replace `YOUR-BUCKET-NAME` with your actual bucket name!

Example:
```json
"Resource": "arn:aws:s3:::invoices-bucket-gcastro/*"
```

3. Click **"Save changes"**

---

### **Step 4: Verify Object Ownership (Should Already Be Set)**

Scroll to **"Object Ownership"**:

- Should show: **"ACLs disabled (recommended)"**
- This is correct! ✅

---

### **Step 5: Add CORS Configuration**

Scroll to **"Cross-origin resource sharing (CORS)"**:

1. Click **"Edit"**
2. Paste this configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD", "PUT", "POST"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://yourdomain.com"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

3. Update `AllowedOrigins` with your actual domain
4. Click **"Save changes"**

---

## 🧪 Test the Setup

### **Test 1: Upload a File**

1. Go to your app: `http://localhost:3000/extraccion`
2. Upload an invoice
3. Click "Validar y Guardar"
4. Should succeed! ✅

### **Test 2: Check S3 URL**

After upload, check the terminal logs:
```bash
✅ File uploaded to S3: https://your-bucket.s3.us-east-1.amazonaws.com/invoices/...
```

Copy that URL and paste it in your browser:
- ✅ **Should display the image/PDF**
- ❌ If 403 error → Bucket policy not applied correctly

---

## 📊 Complete Configuration Summary

### **What You Have (Correct):**
- ✅ Object Ownership: **ACLs disabled**
- ✅ Modern S3 security model

### **What You Need to Add:**
- ⚠️ Block public access: **Partially disabled** (allow bucket policies)
- ⚠️ Bucket policy: **Allow public read**
- ⚠️ CORS: **Allow browser access**

---

## 🔒 Security Notes

### **Public Access Means:**
- ✅ Anyone with the URL can view the file
- ✅ Files are NOT listed publicly (only accessible via direct URL)
- ✅ Upload/delete still requires AWS credentials

### **If You Need Private Files:**
Use **pre-signed URLs** instead (see alternative below).

---

## 🔐 Alternative: Private Files with Signed URLs

If invoices contain sensitive data, keep files private and use signed URLs:

### **1. Don't Add Bucket Policy**
Skip the bucket policy step above. Files will stay private.

### **2. Update Code to Generate Signed URLs**

Add to `lib/s3.ts`:
```typescript
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function getSignedS3Url(
  key: string, 
  expiresIn = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
  });
  
  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
  return signedUrl;
}
```

### **3. Update API to Return Signed URLs**

In `app/api/invoices/route.ts` (GET endpoint):
```typescript
import { getSignedS3Url } from '@/lib/s3';

// After fetching invoices
const facturasWithSignedUrls = await Promise.all(
  facturas.map(async (factura) => {
    if (factura.metadata.s3Key) {
      const signedUrl = await getSignedS3Url(factura.metadata.s3Key);
      return {
        ...factura,
        metadata: {
          ...factura.metadata,
          s3Url: signedUrl, // Temporary signed URL
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
- ✅ Time-limited access (URLs expire)
- ✅ More secure

**Cons:**
- ❌ More complex
- ❌ URLs expire (need regeneration)
- ❌ Slower (API generates URLs)

---

## 📝 Quick Reference

### **Bucket Policy Template**
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

### **CORS Template**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD", "PUT", "POST"],
    "AllowedOrigins": ["http://localhost:3000"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

---

## ✅ After Setup

Once you've added the bucket policy:

1. **No code changes needed** - Already fixed!
2. **Try upload again** - Should work now
3. **Check browser** - Images should display in drawer
4. **Verify URL** - Direct S3 URLs should work

---

## 🚨 Troubleshooting

### **Still getting 403 Forbidden?**

1. **Check bucket policy:**
   - Resource ARN matches your bucket name
   - No typos in bucket name
   - Policy saved successfully

2. **Check Block Public Access:**
   - "Block all public access" is OFF
   - At least "Block public bucket policies" is OFF

3. **Wait a moment:**
   - AWS policy changes can take 1-2 minutes to propagate

4. **Test with new upload:**
   - Old files uploaded before policy won't be affected
   - Upload a new invoice to test

### **Upload fails with different error?**

Check:
- IAM user has `s3:PutObject` permission
- Bucket name in `.env.local` is correct
- AWS credentials are valid

---

## 📚 AWS Documentation

- [S3 Bucket Policies](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-policies.html)
- [S3 Public Access](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html)
- [S3 CORS](https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html)

---

## ✅ Summary

**Problem:** Bucket doesn't allow ACLs  
**Solution:** Use bucket policy instead  
**Code:** Already fixed (ACL removed)  
**AWS Setup:** Add bucket policy (see above)  
**Result:** Files will be publicly accessible via URL

Upload should work after adding the bucket policy! 🚀
