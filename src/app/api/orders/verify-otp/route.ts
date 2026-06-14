export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Order } from '@/lib/models/Order';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const user = getUserFromRequest(req);

    if (!user || user.role !== 'staff') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { orderId, otp } = await req.json();

    if (!orderId || !otp) {
      return NextResponse.json({ error: 'Order ID and OTP are required' }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify that this staff member is assigned to this order
    if (order.assignedStaffId?.toString() !== user.userId) {
      return NextResponse.json({ error: 'Forbidden: You are not assigned to this order' }, { status: 403 });
    }

    if (order.orderStatus !== 'Out for Delivery') {
      return NextResponse.json({ error: 'Order is not out for delivery' }, { status: 400 });
    }

    // Verify OTP
    if (order.deliveryOTP !== otp.trim()) {
      return NextResponse.json({ error: 'Invalid Secure Delivery OTP. Please try again.' }, { status: 400 });
    }

    // OTP matched! Mark as Delivered
    order.orderStatus = 'Delivered';
    // Optionally keep OTP or wipe it
    await order.save();

    return NextResponse.json({
      message: 'Delivery confirmed successfully',
      order,
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
