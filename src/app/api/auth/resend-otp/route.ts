export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { User } from '@/lib/models/User';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ error: 'Account is already verified' }, { status: 400 });
    }

    // Generate new 6-digit OTP (e.g. 123456)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 15); // Expire in 15 minutes

    user.verificationOtp = otp;
    user.verificationOtpExpires = expiry;
    await user.save();

    // Send Verification Email
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email — Doorly',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #ea580c;">Doorly Account Verification</h2>
          <p>Hi ${user.name || 'there'},</p>
          <p>Please use the following 6-digit verification code to activate your account:</p>
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1f2937; margin: 20px 0;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #6b7280;">This code is valid for 15 minutes. If you did not register for an account, please ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ message: 'A new verification code has been sent to your email.' }, { status: 200 });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
