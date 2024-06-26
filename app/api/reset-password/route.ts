import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';
import bcrypt from 'bcrypt';

interface RequestBody {
  token: string;
  password: string;
}

export async function POST(req: Request) {
  try {
    const { token, password }: RequestBody = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    // Check if the token is valid
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('reset_token', token)
      .single();

    if (error || !user || new Date() > new Date(user.reset_token_expiry)) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password and remove the reset token
    await supabase
      .from('users')
      .update({ password: hashedPassword, reset_token: null, reset_token_expiry: null })
      .eq('id', user.id);

    return NextResponse.json({ message: 'Password reset successful' }, { status: 200 });

  } catch (err: any) {
    console.error('Failed to reset password:', err);
    return NextResponse.json({ error: `Failed to reset password: ${err.message}` }, { status: 500 });
  }
}
