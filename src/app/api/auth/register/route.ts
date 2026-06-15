export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Restaurant } from '@/lib/models/Restaurant';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { name, email, password, role, restaurantName } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (!['customer', 'owner'].includes(role)) {
      return NextResponse.json({ error: 'Invalid registration role' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
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
      });

      await newRestaurant.save();
      associatedRestaurantId = newRestaurant._id;
    }

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      associatedRestaurantId,
    });

    await newUser.save();

    return NextResponse.json(
      { message: 'User registered successfully', user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
