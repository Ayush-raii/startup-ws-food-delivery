export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Restaurant } from '@/lib/models/Restaurant';
import { User } from '@/lib/models/User';
import { getUserFromRequest } from '@/lib/auth';

// Update restaurant status (Admin Only)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const user = getUserFromRequest(req);
    const { id } = params;

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { status } = await req.json();
    if (!['active', 'inactive', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    restaurant.status = status;
    await restaurant.save();

    return NextResponse.json({
      message: 'Restaurant status updated successfully',
      restaurant,
    });
  } catch (error: any) {
    console.error('Admin update restaurant status error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Remove/delete a restaurant (Admin Only)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const user = getUserFromRequest(req);
    const { id } = params;

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    await Restaurant.findByIdAndDelete(id);

    // Unbind any associated owners or staff members from this restaurant ID
    await User.updateMany({ associatedRestaurantId: id }, { associatedRestaurantId: null });

    return NextResponse.json({
      message: 'Restaurant deleted successfully',
    });
  } catch (error: any) {
    console.error('Admin delete restaurant error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
