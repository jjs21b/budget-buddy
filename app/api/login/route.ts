import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';
import { SignJWT } from 'jose';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

// Define the secret key for signing JWTs
const secret = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET);

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Find the user in the Supabase database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password')
      .eq('email', email)
      .single();

    if (error || !user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Generate JWT token using the secret key
    const token = await new SignJWT({ id: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(secret);

    return NextResponse.json({ token }, { status: 200 });
  } catch (error) {
    console.error('Failed to login:', error);
    return NextResponse.json({ error: 'Failed to login' }, { status: 500 });
  }
}
