import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

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

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Token valid for 1 hour

    // Store the reset token and expiry in the database
    await supabase
      .from('users')
      .update({ reset_token: resetToken, reset_token_expiry: resetTokenExpiry })
      .eq('email', email);

    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

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
      text: `Please click on the following link to reset your password: ${resetLink}`,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ message: 'Reset link sent' }, { status: 200 });

  } catch (err: any) {
    console.error('Failed to send email:', err);
    return NextResponse.json({ error: `Failed to send email: ${err.message}` }, { status: 500 });
  }
}
