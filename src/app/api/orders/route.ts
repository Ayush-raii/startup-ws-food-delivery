export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Order } from '@/lib/models/Order';
import { Restaurant } from '@/lib/models/Restaurant';
import { getUserFromRequest } from '@/lib/auth';

// Fetch orders depending on user role
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query: any = {};

    if (user.role === 'customer') {
      query.customerId = user.userId;
    } else if (user.role === 'owner') {
      if (!user.associatedRestaurantId) {
        return NextResponse.json({ orders: [] });
      }
      query.restaurantId = user.associatedRestaurantId;
    } else if (user.role === 'staff') {
      query.assignedStaffId = user.userId;
    } else {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Fetch and populate details
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate('customerId', 'name email phone')
      .populate('restaurantId', 'name bannerImage')
      .populate('assignedStaffId', 'name phone');

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Create new order
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const user = getUserFromRequest(req);

    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: 'Only customers can place orders' }, { status: 403 });
    }

    const { restaurantId, items, totalAmount, deliveryAddress } = await req.json();

    if (!restaurantId || !items || !items.length || !totalAmount || !deliveryAddress) {
      return NextResponse.json({ error: 'Invalid order details' }, { status: 400 });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }
    if (restaurant.status !== 'active') {
      return NextResponse.json({ error: 'This restaurant is currently closed for the day and not accepting new orders' }, { status: 400 });
    }

    const newOrder = new Order({
      customerId: user.userId,
      restaurantId,
      items,
      totalAmount,
      deliveryAddress,
      orderStatus: 'Placed',
    });

    await newOrder.save();

    return NextResponse.json(
      { message: 'Order placed successfully', orderId: newOrder._id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
