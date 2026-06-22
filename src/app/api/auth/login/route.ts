export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/db';
import { User } from '@/lib/models/User';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { email, password, phone } = body;

    let user;

    // 1. Staff login via Phone Number
    if (phone) {
      user = await User.findOne({ phone: phone.trim() });
      if (!user) {
        return NextResponse.json({ error: 'Delivery staff account not found with this phone number' }, { status: 404 });
      }
      if (user.role !== 'staff') {
        return NextResponse.json({ error: 'Unauthorized access role' }, { status: 403 });
      }
    } 
    // 2. Customer or Owner login via Email + Password
    else {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
      }

      user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      if (user.role === 'staff') {
        return NextResponse.json({ error: 'Staff must login via phone number' }, { status: 403 });
      }

      const isMatch = await bcrypt.compare(password, user.password || '');
      if (!isMatch) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      if (user.isVerified === false) {
        return NextResponse.json({
          error: 'Account not verified. Please verify your email first.',
          requiresVerification: true,
          email: user.email,
        }, { status: 403 });
      }
    }

    // Generate JWT Token
    const token = signToken({
      userId: user._id.toString(),
      role: user.role,
      associatedRestaurantId: user.associatedRestaurantId ? user.associatedRestaurantId.toString() : null,
    });

    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        associatedRestaurantId: user.associatedRestaurantId,
      },
    });

    // Set HTTP-only Cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
