export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Restaurant } from '@/lib/models/Restaurant';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const { id } = params;
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }
    return NextResponse.json({ restaurant });
  } catch (error: any) {
    console.error('Fetch restaurant error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const user = getUserFromRequest(req);
    const { id } = params;

    // Verify user is owner and owns this restaurant
    if (!user || user.role !== 'owner' || user.associatedRestaurantId !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, bannerImage, cuisineTags, latitude, longitude } = await req.json();

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ error: 'Restaurant name is required' }, { status: 400 });
      }
      restaurant.name = name.trim();
    }
    if (bannerImage !== undefined) {
      restaurant.bannerImage = bannerImage.trim() || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200';
    }
    if (cuisineTags !== undefined) {
      restaurant.cuisineTags = Array.isArray(cuisineTags) ? cuisineTags : [];
    }
    if (latitude !== undefined) {
      restaurant.latitude = Number(latitude);
    }
    if (longitude !== undefined) {
      restaurant.longitude = Number(longitude);
    }

    await restaurant.save();

    return NextResponse.json({
      message: 'Restaurant profile updated successfully',
      restaurant,
    });
  } catch (error: any) {
    console.error('Update restaurant details error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
