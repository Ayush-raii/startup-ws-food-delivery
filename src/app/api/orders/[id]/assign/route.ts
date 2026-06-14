export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Order } from '@/lib/models/Order';
import { User } from '@/lib/models/User';
import { getUserFromRequest } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const user = getUserFromRequest(req);

    if (!user || user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { staffId } = await req.json();
    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
    }

    const order = await Order.findById(params.id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify ownership
    if (order.restaurantId.toString() !== user.associatedRestaurantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify staff exists and belongs to this restaurant
    const staff = await User.findOne({
      _id: staffId,
      role: 'staff',
      associatedRestaurantId: user.associatedRestaurantId,
    });
    if (!staff) {
      return NextResponse.json({ error: 'Selected staff member not found' }, { status: 404 });
    }

    // Generate secure 4-digit delivery OTP
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

    order.assignedStaffId = staffId;
    order.orderStatus = 'Out for Delivery';
    order.deliveryOTP = generatedOtp;

    await order.save();

    return NextResponse.json({
      message: 'Order dispatched successfully',
      order,
    });
  } catch (error: any) {
    console.error('Assign delivery staff error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
