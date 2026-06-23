export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/db';
import { User } from '@/lib/models/User';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email, otp, password } = await req.json();

    if (!email || !otp || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const lowercaseEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: lowercaseEmail });

    if (!user) {
      return NextResponse.json({ error: 'No account found with this email address' }, { status: 404 });
    }

    // Verify OTP again for safety on submission
    if (!user.resetOtp || user.resetOtp !== otp.trim()) {
      return NextResponse.json({ error: 'Invalid verification OTP' }, { status: 400 });
    }

    if (!user.resetOtpExpires || new Date() > new Date(user.resetOtpExpires)) {
      return NextResponse.json({ error: 'Verification OTP has expired. Please request a new one.' }, { status: 400 });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    // Clear reset OTP fields
    user.resetOtp = null;
    user.resetOtpExpires = null;
    await user.save();

    return NextResponse.json({ message: 'Password has been reset successfully' });
  } catch (error: any) {
    console.error('Reset password finalization error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
