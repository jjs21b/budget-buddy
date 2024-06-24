import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  console.log('API handler called');

  const { name, email, password } = await req.json();

  console.log('Request body:', { name, email, password });

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
  }

  // Check if the user already exists
  const { data: existingUser, error: existingUserError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (existingUser) {
    return NextResponse.json({ error: 'User already exists' }, { status: 400 });
  }

  if (existingUserError && existingUserError.code !== 'PGRST116') {
    return NextResponse.json({ error: existingUserError.message }, { status: 500 });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert the new user into the users table
  const { data, error } = await supabase
    .from('users')
    .insert([{ name, email, password: hashedPassword }]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
