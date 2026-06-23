export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { User } from '@/lib/models/User';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email } = await req.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    const lowercaseEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: lowercaseEmail });

    if (!user) {
      return NextResponse.json({ error: 'No account found with this email address' }, { status: 404 });
    }

    // Generate 6-digit OTP code
    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 15); // Valid for 15 minutes

    user.resetOtp = resetOtp;
    user.resetOtpExpires = expiry;
    await user.save();

    // Send reset OTP email
    try {
      await sendEmail({
        to: lowercaseEmail,
        subject: 'Reset Your Password — Doorly',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #ea580c;">Password Reset Verification</h2>
            <p>Hi ${user.name},</p>
            <p>You requested a password reset. Please use the following 6-digit verification code to reset your password:</p>
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1f2937; margin: 20px 0;">
              ${resetOtp}
            </div>
            <p style="font-size: 12px; color: #6b7280;">This code is valid for 15 minutes. If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('Failed to send password reset email:', err);
      return NextResponse.json({ error: 'Failed to send OTP email. Please check your system email configuration.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'OTP sent successfully to your email address' });
  } catch (error: any) {
    console.error('Forgot password OTP request error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
