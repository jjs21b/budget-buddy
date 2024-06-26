import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';
import nodemailer from 'nodemailer';

// Define the expected shape of the request body
interface RequestBody {
  email: string;
}

export async function POST(req: Request) {
  try {
    const { email }: RequestBody = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if the user exists
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create a transporter for sending emails
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER, // Your Gmail address
        pass: process.env.GMAIL_PASSWORD, // Your Gmail App Password
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Reset Password',
      text: 'Please click on the following link to reset your password: <reset_link_here>',
    };

    await transporter.sendMail(mailOptions);
    console.log(process.env.GMAIL_USER);
    console.log(process.env.GMAIL_PASSWORD);
    return NextResponse.json({ message: 'Reset link sent' }, { status: 200 });

  } catch (err: any) {
    console.error('Failed to send email:', err);
    return NextResponse.json({ error: `Failed to send email: ${err.message}` }, { status: 500 });
  }
}
