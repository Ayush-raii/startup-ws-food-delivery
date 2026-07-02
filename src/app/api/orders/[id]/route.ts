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

// Update order status (Owner status updates, or Customer cancellations)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await req.json();
    const order = await Order.findById(params.id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (user.role === 'customer') {
      // Customer cancellation
      if (status !== 'Rejected') {
        return NextResponse.json({ error: 'Customers can only cancel (Reject) orders' }, { status: 400 });
      }

      if (order.customerId.toString() !== user.userId) {
        return NextResponse.json({ error: 'Forbidden. You do not own this order.' }, { status: 403 });
      }

      if (!['Placed', 'Accepted'].includes(order.orderStatus)) {
        return NextResponse.json({ error: 'Cannot cancel order. The kitchen has already started preparing it.' }, { status: 400 });
      }

      order.orderStatus = 'Rejected';
      order.cancelledBy = 'customer';
      await order.save();
      return NextResponse.json({ message: 'Order cancelled successfully', order });
    } else if (user.role === 'owner') {
      if (!['Accepted', 'Preparing', 'Rejected'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status update for this action' }, { status: 400 });
      }

      // Check restaurant owner ownership
      if (order.restaurantId.toString() !== user.associatedRestaurantId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      order.orderStatus = status;
      if (status === 'Rejected') {
        order.cancelledBy = 'restaurant';
      }
      await order.save();
      return NextResponse.json({ message: 'Order status updated successfully', order });
    } else if (user.role === 'admin') {
      if (status !== 'Delivered') {
        return NextResponse.json({ error: 'Admin can only force complete (Delivered) orders' }, { status: 400 });
      }
      order.orderStatus = 'Delivered';
      await order.save();
      return NextResponse.json({ message: 'Order status force completed by admin', order });
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch (error: any) {
    console.error('Update order status error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
