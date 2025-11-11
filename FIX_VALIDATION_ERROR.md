# 🔧 Fix: "Error al validar la factura"

## ❌ Error Message
```
Error al validar la factura
```

This generic error can have multiple causes. Let's diagnose and fix it.

---

## 🔍 Most Common Causes

### **1. Missing AWS S3 Credentials (Most Likely)**

#### **Symptoms:**
- Error occurs when clicking "Validar y Guardar"
- Console shows S3 upload failure

#### **Diagnosis:**
Check your `.env.local` file for these variables:
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET_NAME=your-bucket-name
```

#### **Solution:**
1. **Create IAM User in AWS:**
   - Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
   - Click "Users" → "Create user"
   - Name: `invoice-uploader`
   - Attach policy: `AmazonS3FullAccess` (or create custom policy)

2. **Generate Access Keys:**
   - Select the user
   - Go to "Security credentials" tab
   - Click "Create access key"
   - Choose "Application running outside AWS"
   - Copy both keys

3. **Add to `.env.local`:**
   ```bash
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=wJalr...
   AWS_S3_BUCKET_NAME=your-bucket-name
   ```

4. **Restart Server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

---

### **2. S3 Bucket Doesn't Exist**

#### **Symptoms:**
- Error: "The specified bucket does not exist"
- S3 upload fails

#### **Solution:**
1. **Create S3 Bucket:**
   - Go to [S3 Console](https://s3.console.aws.amazon.com/)
   - Click "Create bucket"
   - Name: `invoices-bucket-[your-name]` (must be globally unique)
   - Region: Same as `AWS_REGION` in `.env.local`
   - Uncheck "Block all public access" (for public files)
   - Click "Create bucket"

2. **Update `.env.local`:**
   ```bash
   AWS_S3_BUCKET_NAME=invoices-bucket-yourname
   ```

---

### **3. S3 Permissions Issue**

#### **Symptoms:**
- Error: "Access Denied"
- 403 Forbidden

#### **Solution:**

**A. IAM User Policy:**
Ensure your IAM user has this policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

**B. Bucket ACL Settings:**
- Go to S3 bucket → Permissions
- Object Ownership: "ACLs enabled"
- Block public access: Allow ACLs

---

### **4. MongoDB Connection Issue**

#### **Symptoms:**
- Error: "MONGODB_URI is not defined"
- Error: "Failed to connect to MongoDB"

#### **Solution:**
1. **Check `.env.local`:**
   ```bash
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/
   ```

2. **Verify MongoDB Atlas:**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com/)
   - Check cluster is running
   - Verify IP whitelist (0.0.0.0/0 for development)
   - Check database user credentials

3. **Test Connection:**
   ```bash
   # In terminal
   node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('✅ Connected')).catch(e => console.error('❌', e))"
   ```

---

### **5. Mongoose Validation Error**

#### **Symptoms:**
- Error: "Validation failed"
- Missing required fields

#### **Solution:**
Check that extracted data has required fields. The Factura model requires:
- `numeroFactura` (optional but recommended)
- `metadata.fileName`
- `metadata.processedAt`

---

## 🧪 Debugging Steps

### **Step 1: Check Server Logs**

Look at your terminal where `npm run dev` is running. You should see detailed logs:

```bash
═══════════════════════════════════════════════════════
✅ [BACKEND] VALIDATION API ENDPOINT CALLED
═══════════════════════════════════════════════════════
📦 [BACKEND] Parsing FormData...
✅ [BACKEND] FormData parsed successfully
💾 [BACKEND] Converting file to buffer...
✅ [BACKEND] File converted to buffer
📤 [BACKEND] Uploading file to S3...
❌ [BACKEND] VALIDATION FAILED  <-- Look for this!
💥 Error details: ...
```

### **Step 2: Check Browser Console**

Open DevTools (F12) → Console tab:

```javascript
// Look for error messages
❌ [FRONTEND] Validation failed
   → Error: Error al validar la factura
   → Message: [specific error here]
```

### **Step 3: Test Environment Variables**

Create `test-env.js`:
```javascript
console.log('Environment Variables:');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
console.log('AWS_REGION:', process.env.AWS_REGION || '❌ Missing');
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing');
console.log('AWS_S3_BUCKET_NAME:', process.env.AWS_S3_BUCKET_NAME || '❌ Missing');
```

Run:
```bash
node -r dotenv/config test-env.js
```

---

## 📋 Complete Checklist

### **Environment Variables:**
- [ ] `OPENAI_API_KEY` is set
- [ ] `MONGODB_URI` is set and valid
- [ ] `AWS_REGION` is set (e.g., `us-east-1`)
- [ ] `AWS_ACCESS_KEY_ID` is set
- [ ] `AWS_SECRET_ACCESS_KEY` is set
- [ ] `AWS_S3_BUCKET_NAME` is set
- [ ] Server restarted after adding variables

### **AWS S3:**
- [ ] IAM user created with S3 permissions
- [ ] Access keys generated
- [ ] S3 bucket created
- [ ] Bucket name matches `.env.local`
- [ ] Bucket allows public ACLs
- [ ] CORS configured

### **MongoDB:**
- [ ] Cluster is running
- [ ] IP address whitelisted
- [ ] Database user exists
- [ ] Connection string is correct

### **Code:**
- [ ] `ACL: 'public-read'` uncommented in `lib/s3.ts`
- [ ] Server restarted

---

## 🔧 Quick Fix Script

Create `scripts/test-upload.js`:

```javascript
require('dotenv').config({ path: '.env.local' });
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

async function testS3Upload() {
  console.log('Testing S3 Upload...\n');
  
  // Check environment variables
  const required = [
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET_NAME'
  ];
  
  for (const key of required) {
    if (!process.env[key]) {
      console.error(`❌ Missing: ${key}`);
      return;
    }
    console.log(`✅ ${key}: Set`);
  }
  
  // Test upload
  try {
    const s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: 'test/test.txt',
      Body: Buffer.from('Test upload'),
      ContentType: 'text/plain',
      ACL: 'public-read',
    });
    
    await s3Client.send(command);
    
    const url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/test/test.txt`;
    console.log('\n✅ Upload successful!');
    console.log('URL:', url);
    
  } catch (error) {
    console.error('\n❌ Upload failed:', error.message);
  }
}

testS3Upload();
```

Run:
```bash
npm install @aws-sdk/client-s3
node scripts/test-upload.js
```

---

## 🎯 Step-by-Step Solution

### **If you see: "Missing AWS credentials"**

1. Add to `.env.local`:
   ```bash
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   AWS_S3_BUCKET_NAME=your-bucket
   ```

2. Restart server:
   ```bash
   npm run dev
   ```

3. Try upload again

### **If you see: "Bucket does not exist"**

1. Create bucket in AWS S3 Console
2. Update `.env.local` with correct bucket name
3. Restart server
4. Try upload again

### **If you see: "Access Denied"**

1. Check IAM user has S3 permissions
2. Check bucket allows public ACLs
3. Verify access keys are correct
4. Try upload again

### **If you see: "MongoDB connection failed"**

1. Check MongoDB Atlas is running
2. Verify connection string
3. Whitelist IP address (0.0.0.0/0)
4. Try upload again

---

## 📚 Related Documentation

- `FIX_S3_IMAGE_PREVIEW.md` - S3 configuration details
- `env-template.txt` - Environment variables template
- `TROUBLESHOOTING.md` - General troubleshooting

---

## ✅ Expected Success Flow

When everything is configured correctly, you should see:

**Terminal:**
```bash
═══════════════════════════════════════════════════════
✅ [BACKEND] VALIDATION API ENDPOINT CALLED
═══════════════════════════════════════════════════════
📦 [BACKEND] Parsing FormData...
✅ [BACKEND] FormData parsed successfully
💾 [BACKEND] Converting file to buffer...
✅ [BACKEND] File converted to buffer
📤 [BACKEND] Uploading file to S3...
✅ File uploaded to S3: https://bucket.s3.amazonaws.com/...
✅ [BACKEND] File uploaded to S3 in 1234 ms
🗄️  [BACKEND] Connecting to MongoDB...
✅ [BACKEND] Connected to MongoDB in 56 ms
🔍 [BACKEND] Checking for duplicate invoices...
✅ [BACKEND] No duplicate found
💾 [BACKEND] Saving invoice to MongoDB...
✅ [BACKEND] Invoice saved to database in 89 ms
═══════════════════════════════════════════════════════
✅ [BACKEND] VALIDATION COMPLETED SUCCESSFULLY
═══════════════════════════════════════════════════════
```

**Browser:**
```
✅ Factura validada y guardada exitosamente
```

---

## 🚨 Still Not Working?

If you've tried everything above and it still doesn't work:

1. **Share the exact error message** from:
   - Terminal (server logs)
   - Browser console (F12)

2. **Check these files exist:**
   - `.env.local` (in project root)
   - Contains all required variables
   - No typos in variable names

3. **Verify server restart:**
   - Stop server (Ctrl+C)
   - Start again: `npm run dev`
   - Environment variables only load on startup

4. **Test each component separately:**
   - MongoDB connection
   - S3 upload
   - OpenAI API

---

## 💡 Pro Tips

1. **Use `.env.local` not `.env`**
   - Next.js prioritizes `.env.local`
   - It's in `.gitignore` by default

2. **Never commit credentials**
   - Keep `.env.local` out of Git
   - Use `.env.example` for templates

3. **Restart after changes**
   - Environment variables load once
   - Always restart after editing `.env.local`

4. **Check logs first**
   - Terminal logs show exact error
   - Don't guess, read the logs!

---

## ✅ Summary

**Most Common Issue:** Missing AWS S3 credentials

**Quick Fix:**
1. Add AWS credentials to `.env.local`
2. Create S3 bucket
3. Restart server
4. Try upload again

**Verification:**
- Check terminal logs for specific error
- Ensure all environment variables are set
- Test S3 upload separately if needed

Upload should work after fixing! 🚀
