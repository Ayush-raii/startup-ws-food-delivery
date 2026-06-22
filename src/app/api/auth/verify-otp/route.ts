export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { User } from '@/lib/models/User';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ message: 'Account is already verified' }, { status: 200 });
    }

    if (!user.verificationOtp || user.verificationOtp !== otp.trim()) {
      return NextResponse.json({ error: 'Invalid verification OTP' }, { status: 400 });
    }

    if (user.verificationOtpExpires && new Date() > new Date(user.verificationOtpExpires)) {
      return NextResponse.json({ error: 'Verification OTP has expired. Please request a new one.' }, { status: 400 });
    }

    // OTP verified! Activate account.
    user.isVerified = true;
    user.verificationOtp = null;
    user.verificationOtpExpires = null;
    await user.save();

    return NextResponse.json({ message: 'Email verified and account activated successfully.' }, { status: 200 });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
