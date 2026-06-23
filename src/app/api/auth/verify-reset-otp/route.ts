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

    const lowercaseEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: lowercaseEmail });

    if (!user) {
      return NextResponse.json({ error: 'No account found with this email address' }, { status: 404 });
    }

    if (!user.resetOtp || user.resetOtp !== otp.trim()) {
      return NextResponse.json({ error: 'Invalid verification OTP' }, { status: 400 });
    }

    if (!user.resetOtpExpires || new Date() > new Date(user.resetOtpExpires)) {
      return NextResponse.json({ error: 'Verification OTP has expired. Please request a new one.' }, { status: 400 });
    }

    return NextResponse.json({ message: 'OTP verified successfully' });
  } catch (error: any) {
    console.error('Verify reset OTP error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
