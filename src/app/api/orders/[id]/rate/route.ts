export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Order } from '@/lib/models/Order';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const user = getUserFromRequest(req);

    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized. Customer access required.' }, { status: 401 });
    }

    const { restaurantRating, deliveryRating } = await req.json();

    if (restaurantRating === undefined || deliveryRating === undefined) {
      return NextResponse.json({ error: 'Both restaurant and delivery ratings are required.' }, { status: 400 });
    }

    const order = await Order.findById(params.id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Check ownership
    if (order.customerId.toString() !== user.userId) {
      return NextResponse.json({ error: 'Forbidden. You do not own this order.' }, { status: 403 });
    }

    // Check status
    if (order.orderStatus !== 'Delivered') {
      return NextResponse.json({ error: 'Ratings can only be submitted for delivered orders.' }, { status: 400 });
    }

    // Save ratings
    order.restaurantRating = Number(restaurantRating);
    order.deliveryRating = Number(deliveryRating);
    await order.save();

    return NextResponse.json({ message: 'Rating submitted successfully!', order });
  } catch (error: any) {
    console.error('Rate order error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
