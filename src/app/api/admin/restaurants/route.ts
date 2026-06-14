export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Restaurant } from '@/lib/models/Restaurant';
import { Order } from '@/lib/models/Order';
import { User } from '@/lib/models/User';
import { getUserFromRequest } from '@/lib/auth';

// Fetch all restaurants with analytics (Admin Only)
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = getUserFromRequest(req);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const restaurants = await Restaurant.find().lean();
    const orders = await Order.find().lean();
    const users = await User.find({ role: 'owner' }).select('name email associatedRestaurantId').lean();

    // Map metrics for each restaurant
    const restaurantMetrics = restaurants.map((rest: any) => {
      // Find owner of this restaurant
      const owner = users.find(
        (u: any) => u.associatedRestaurantId && u.associatedRestaurantId.toString() === rest._id.toString()
      );

      // Find orders for this restaurant
      const restOrders = orders.filter((o: any) => o.restaurantId.toString() === rest._id.toString());
      
      const totalOrders = restOrders.length;
      
      // Calculate revenue based only on Delivered status
      const totalRevenue = restOrders
        .filter((o: any) => o.orderStatus === 'Delivered')
        .reduce((sum: number, o: any) => sum + o.totalAmount, 0);

      // Platform commission is flat 10% of revenue
      const commission = Number((totalRevenue * 0.1).toFixed(2));

      return {
        ...rest,
        owner: owner ? { name: owner.name, email: owner.email } : { name: 'No Owner Registered', email: 'N/A' },
        stats: {
          totalOrders,
          totalRevenue,
          commission,
        },
      };
    });

    return NextResponse.json({ restaurants: restaurantMetrics });
  } catch (error: any) {
    console.error('Admin fetch restaurants error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Create new restaurant directly from Admin Panel (Admin Only)
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const user = getUserFromRequest(req);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { name, bannerImage, cuisineTags } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Restaurant name is required' }, { status: 400 });
    }

    const newRestaurant = new Restaurant({
      name: name.trim(),
      bannerImage: bannerImage?.trim() || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200',
      cuisineTags: Array.isArray(cuisineTags) ? cuisineTags : ['Fast Food', 'Multi-Cuisine'],
      status: 'active', // Admin created restaurants can start as active
      menu: [],
    });

    await newRestaurant.save();

    return NextResponse.json({
      message: 'Restaurant created successfully',
      restaurant: newRestaurant,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Admin create restaurant error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
