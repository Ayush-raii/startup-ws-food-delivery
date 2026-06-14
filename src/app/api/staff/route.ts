export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { User } from '@/lib/models/User';
import { getUserFromRequest } from '@/lib/auth';

// Get all staff for owner's restaurant
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = getUserFromRequest(req);

    if (!user || user.role !== 'owner' || !user.associatedRestaurantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const staffList = await User.find({
      role: 'staff',
      associatedRestaurantId: user.associatedRestaurantId,
    }).select('-password');

    return NextResponse.json({ staff: staffList });
  } catch (error: any) {
    console.error('Fetch staff error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Register new staff (Name + Phone) under owner's restaurant
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const user = getUserFromRequest(req);

    if (!user || user.role !== 'owner' || !user.associatedRestaurantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { name, phone } = await req.json();

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone number are required' }, { status: 400 });
    }

    // Check if phone number is already registered globally
    const existingStaff = await User.findOne({ phone: phone.trim() });
    if (existingStaff) {
      return NextResponse.json(
        { error: 'A user with this phone number is already registered' },
        { status: 400 }
      );
    }

    const newStaff = new User({
      name: name.trim(),
      phone: phone.trim(),
      role: 'staff',
      associatedRestaurantId: user.associatedRestaurantId,
    });

    await newStaff.save();

    return NextResponse.json(
      { message: 'Staff registered successfully', staff: newStaff },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Register staff error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
