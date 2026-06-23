export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Restaurant } from '@/lib/models/Restaurant';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { name, email, password, role, restaurantName, latitude, longitude, phone } = body;

    if (!name || !email || !password || !role || !phone) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (!['customer', 'owner'].includes(role)) {
      return NextResponse.json({ error: 'Invalid registration role' }, { status: 400 });
    }

    const lowercaseEmail = email.toLowerCase().trim();
    const cleanedPhone = phone.trim();

    if (!cleanedPhone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Check if user already exists by email
    const existingUser = await User.findOne({ email: lowercaseEmail });
    if (existingUser) {
      if (existingUser.isVerified) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
      } else {
        // Delete the unverified user and their associated restaurant if they are an owner
        if (existingUser.role === 'owner' && existingUser.associatedRestaurantId) {
          await Restaurant.deleteOne({ _id: existingUser.associatedRestaurantId });
        }
        await User.deleteOne({ _id: existingUser._id });
      }
    }

    // Check if phone number is already registered by another user
    const existingPhone = await User.findOne({ phone: cleanedPhone });
    if (existingPhone) {
      return NextResponse.json({ error: 'Phone number already registered' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let associatedRestaurantId = null;

    // If owner, create their restaurant as well
    if (role === 'owner') {
      if (!restaurantName) {
        return NextResponse.json({ error: 'Restaurant name is required for owners' }, { status: 400 });
      }

      // Create a default restaurant for the owner
      const newRestaurant = new Restaurant({
        name: restaurantName,
        bannerImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200',
        cuisineTags: ['Fast Food', 'Multi-Cuisine'],
        status: 'pending',
        menu: [], // Empty menu initially
        latitude: latitude !== undefined ? Number(latitude) : 28.6139,
        longitude: longitude !== undefined ? Number(longitude) : 77.2090,
        ownerPhone: cleanedPhone,
      });

      await newRestaurant.save();
      associatedRestaurantId = newRestaurant._id;
    }

    // Gmail OTP logic
    const isGmail = lowercaseEmail.endsWith('@gmail.com');
    let isVerified = true;
    let verificationOtp = null;
    let verificationOtpExpires = null;

    if (isGmail) {
      isVerified = false;
      verificationOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + 15); // 15 mins expiry
      verificationOtpExpires = expiry;
    }

    const newUser = new User({
      name,
      email: lowercaseEmail,
      password: hashedPassword,
      phone: cleanedPhone,
      role,
      associatedRestaurantId,
      isVerified,
      verificationOtp,
      verificationOtpExpires,
    });

    await newUser.save();

    if (isGmail) {
      try {
        await sendEmail({
          to: lowercaseEmail,
          subject: 'Verify Your Email — Doorly',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #ea580c;">Doorly Account Verification</h2>
              <p>Hi ${name},</p>
              <p>Please use the following 6-digit verification code to activate your account:</p>
              <div style="background-color: #f3f4f6; border-radius: 8px; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1f2937; margin: 20px 0;">
                ${verificationOtp}
              </div>
              <p style="font-size: 12px; color: #6b7280;">This code is valid for 15 minutes. If you did not register for an account, please ignore this email.</p>
            </div>
          `,
        });
      } catch (err) {
        console.error('Failed to send verification email during register:', err);
      }

      return NextResponse.json(
        { 
          message: 'User registered successfully. An OTP has been sent to your Gmail address.', 
          requiresVerification: true, 
          email: lowercaseEmail,
          user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } 
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { message: 'User registered successfully', user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
