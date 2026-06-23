export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Restaurant } from '@/lib/models/Restaurant';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const tokenPayload = getUserFromRequest(req);

    if (!tokenPayload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await User.findById(tokenPayload.userId).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const tokenPayload = getUserFromRequest(req);

    if (!tokenPayload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { name, phone } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const user = await User.findById(tokenPayload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.name = name.trim();

    if (phone !== undefined) {
      const cleanedPhone = phone.trim();
      if (!cleanedPhone) {
        return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
      }

      // Check if phone number is already registered by another user
      const existingPhone = await User.findOne({
        phone: cleanedPhone,
        _id: { $ne: tokenPayload.userId }
      });
      if (existingPhone) {
        return NextResponse.json({ error: 'Phone number already registered' }, { status: 400 });
      }
      user.phone = cleanedPhone;

      // If owner, also update ownerPhone in their Restaurant model
      if (user.role === 'owner' && user.associatedRestaurantId) {
        await Restaurant.findByIdAndUpdate(user.associatedRestaurantId, {
          ownerPhone: cleanedPhone
        });
      }
    }

    await user.save();

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        associatedRestaurantId: user.associatedRestaurantId,
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
