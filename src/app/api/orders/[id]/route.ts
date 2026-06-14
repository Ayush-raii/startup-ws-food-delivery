export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Order } from '@/lib/models/Order';
import { getUserFromRequest } from '@/lib/auth';

// Fetch single order details
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const order = await Order.findById(params.id)
      .populate('customerId', 'name email phone')
      .populate('restaurantId', 'name bannerImage')
      .populate('assignedStaffId', 'name phone');

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Role checks
    const isCustomer = user.role === 'customer' && order.customerId._id.toString() === user.userId;
    const isOwner = user.role === 'owner' && order.restaurantId._id.toString() === user.associatedRestaurantId;
    const isStaff = user.role === 'staff' && order.assignedStaffId?._id.toString() === user.userId;

    if (!isCustomer && !isOwner && !isStaff) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error('Fetch order error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Update order status (Owner-only actions)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const user = getUserFromRequest(req);

    if (!user || user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { status } = await req.json();
    if (!['Accepted', 'Preparing', 'Rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status update for this action' }, { status: 400 });
    }

    const order = await Order.findById(params.id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check restaurant owner ownership
    if (order.restaurantId.toString() !== user.associatedRestaurantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    order.orderStatus = status;
    await order.save();

    return NextResponse.json({ message: 'Order status updated successfully', order });
  } catch (error: any) {
    console.error('Update order status error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
