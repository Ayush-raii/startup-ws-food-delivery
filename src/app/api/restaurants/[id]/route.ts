export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Restaurant } from '@/lib/models/Restaurant';
import { Order } from '@/lib/models/Order';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const { id } = params;
    const restaurant = await Restaurant.findById(id).lean();
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Dynamic rating calculation based on orders
    const ratedOrders = await Order.find({
      restaurantId: id,
      orderStatus: 'Delivered',
      restaurantRating: { $ne: null }
    }).lean();

    const totalRatings = ratedOrders.length;
    const averageRating = totalRatings > 0
      ? Number((ratedOrders.reduce((sum: number, o: any) => sum + (o.restaurantRating || 0), 0) / totalRatings).toFixed(1))
      : null;

    const restaurantWithStats = {
      ...restaurant,
      averageRating,
      totalRatings
    };

    return NextResponse.json({ restaurant: restaurantWithStats });
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

    const { name, bannerImage, cuisineTags, latitude, longitude, status } = await req.json();

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
    if (status !== undefined) {
      if (!['active', 'inactive'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status option' }, { status: 400 });
      }
      restaurant.status = status;
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
