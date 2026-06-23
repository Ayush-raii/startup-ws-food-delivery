export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Restaurant } from '@/lib/models/Restaurant';
import { Order } from '@/lib/models/Order';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const restaurants = await Restaurant.find({ status: 'active' }).lean();
    const ratedOrders = await Order.find({
      orderStatus: 'Delivered',
      restaurantRating: { $ne: null }
    }).select('restaurantId restaurantRating').lean();

    // Group ratings by restaurant ID
    const ratingsMap: Record<string, { sum: number; count: number }> = {};
    ratedOrders.forEach((o: any) => {
      const rId = o.restaurantId.toString();
      if (!ratingsMap[rId]) {
        ratingsMap[rId] = { sum: 0, count: 0 };
      }
      ratingsMap[rId].sum += o.restaurantRating;
      ratingsMap[rId].count += 1;
    });

    const restaurantsWithRatings = restaurants.map((rest: any) => {
      const rId = rest._id.toString();
      const ratingInfo = ratingsMap[rId];
      const averageRating = ratingInfo && ratingInfo.count > 0
        ? Number((ratingInfo.sum / ratingInfo.count).toFixed(1))
        : null;
      return {
        ...rest,
        averageRating
      };
    });

    return NextResponse.json({ restaurants: restaurantsWithRatings });
  } catch (error: any) {
    console.error('Fetch restaurants error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
