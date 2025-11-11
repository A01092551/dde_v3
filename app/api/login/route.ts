import { NextRequest, NextResponse } from 'next/server';
import { userDb } from '@/lib/db/users';

export async function POST(request: NextRequest) {
  const requestStartTime = Date.now();
  
  try {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🔐 [BACKEND] LOGIN API ENDPOINT CALLED');
    console.log('═══════════════════════════════════════════════════════');
    console.log('⏰ Request received at:', new Date().toISOString());
    console.log('🌐 Request method:', request.method);
    console.log('🔗 Request URL:', request.url);
    console.log('📋 Request headers:', Object.fromEntries(request.headers.entries()));

    console.log('\n📦 [BACKEND] Parsing request body...');
    const body = await request.json();
    console.log('✅ [BACKEND] Body parsed successfully');
    console.log('📧 Email received:', body.email);
    console.log('🔒 Password received:', body.password ? '***hidden*** (length: ' + body.password.length + ')' : 'undefined');

    const { email, password } = body;

    // Validation
    console.log('\n🔍 [BACKEND] Starting validation...');
    if (!email || !password) {
      console.log('❌ [BACKEND] Validation failed: Missing credentials');
      console.log('   → Email provided:', !!email);
      console.log('   → Password provided:', !!password);
      console.log('📤 [BACKEND] Sending 400 Bad Request response');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    console.log('✅ [BACKEND] Validation passed: Both fields provided');

    // Database lookup
    console.log('\n🗄️  [BACKEND] Querying SQLite database...');
    console.log('   → Looking up user by email:', email);
    const dbQueryStart = Date.now();
    const user = userDb.getUserByEmail(email);
    const dbQueryDuration = Date.now() - dbQueryStart;
    console.log('   → Database query completed in', dbQueryDuration, 'ms');

    if (!user) {
      console.log('❌ [BACKEND] User not found in database');
      console.log('   → Email searched:', email);
      console.log('📤 [BACKEND] Sending 401 Unauthorized response');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('✅ [BACKEND] User found in database');
    console.log('👤 User details:');
    console.log('   → ID:', user.id);
    console.log('   → Name:', user.name);
    console.log('   → Email:', user.email);
    console.log('   → Role:', user.role);
    console.log('   → Active:', user.is_active ? 'Yes' : 'No');
    console.log('   → Created at:', user.created_at);

    // Check if account is active
    console.log('\n🔍 [BACKEND] Checking account status...');
    if (!user.is_active) {
      console.log('❌ [BACKEND] Account is disabled');
      console.log('   → User ID:', user.id);
      console.log('   → Email:', user.email);
      console.log('📤 [BACKEND] Sending 403 Forbidden response');
      return NextResponse.json(
        { error: 'Account is disabled' },
        { status: 403 }
      );
    }
    console.log('✅ [BACKEND] Account is active');

    // Password verification
    console.log('\n🔐 [BACKEND] Verifying password...');
    console.log('   → Password from request:', '***hidden***');
    console.log('   → Password from database:', '***hidden***');
    console.log('   → Comparison method: Plain text (⚠️ INSECURE - Should use bcrypt)');
    
    if (user.password !== password) {
      console.log('❌ [BACKEND] Password verification failed');
      console.log('   → Passwords do not match');
      console.log('📤 [BACKEND] Sending 401 Unauthorized response');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    console.log('✅ [BACKEND] Password verified successfully');

    // Success
    const requestDuration = Date.now() - requestStartTime;
    console.log('\n✅ [BACKEND] Authentication successful!');
    console.log('📦 [BACKEND] Preparing response payload...');
    
    const responsePayload = {
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
    
    console.log('📋 Response payload:', responsePayload);
    console.log('⏱️  Total request duration:', requestDuration, 'ms');
    console.log('📤 [BACKEND] Sending 200 OK response');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ [BACKEND] LOGIN REQUEST COMPLETED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════\n');

    return NextResponse.json(responsePayload);

  } catch (error) {
    const requestDuration = Date.now() - requestStartTime;
    console.log('\n═══════════════════════════════════════════════════════');
    console.error('❌ [BACKEND] LOGIN REQUEST FAILED WITH EXCEPTION');
    console.log('═══════════════════════════════════════════════════════');
    console.error('💥 Exception details:', error);
    console.error('   → Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('   → Error message:', error instanceof Error ? error.message : String(error));
    
    if (error instanceof Error && error.stack) {
      console.error('   → Stack trace:');
      console.error(error.stack);
    }
    
    console.error('⏱️  Request duration before failure:', requestDuration, 'ms');
    console.log('📤 [BACKEND] Sending 500 Internal Server Error response');
    console.log('═══════════════════════════════════════════════════════\n');

    return NextResponse.json(
      {
        error: 'Login failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}