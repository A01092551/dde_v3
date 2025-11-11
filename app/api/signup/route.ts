import { NextRequest, NextResponse } from 'next/server';
import { userDb } from '@/lib/db/users';

export async function POST(request: NextRequest) {
  try {
    console.log(' Receiving signup request...');

    // Get data from body
    const body = await request.json();
    const { name, email, password, confirmPassword } = body;

    // Validate required fields
    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Validate password match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Check if user already exists
    if (userDb.emailExists(email)) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Create new user
    // NOTE: In production, you should hash the password using bcrypt
    // For now, storing plain text (NOT RECOMMENDED for production)
    const newUser = userDb.createUser({
      name: name.trim(),
      email: email.toLowerCase(),
      password, // TODO: Hash this with bcrypt in production
      role: 'user'
    });

    console.log('✅ User created with ID:', newUser.id);

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name
    });

  } catch (error) {
    console.error('❌ Error creating user:', error);

    // Handle SQLite unique constraint error (duplicate email)
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: 'Error creating account',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}