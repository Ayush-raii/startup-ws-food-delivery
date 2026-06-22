export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Order } from '@/lib/models/Order';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = getUserFromRequest(req);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    // Retrieve all orders, populated with customer details and restaurant details
    const orders = await Order.find()
      .populate('customerId', 'name email')
      .populate('restaurantId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Generate CSV Header
    const csvHeader = [
      'Order ID',
      'Date/Time',
      'Restaurant Name',
      'Customer Name',
      'Total Items (Quantity)',
      'Total Amount (INR)',
      'Order Status',
      'Platform Commission (10%) (INR)',
      'Merchant Profit (90%) (INR)',
    ].join(',');

    // Map orders to CSV rows
    const csvRows = orders.map((order: any) => {
      const isDelivered = order.orderStatus === 'Delivered';
      
      // Commission and Profit calculations (only for Delivered orders)
      const commission = isDelivered ? Number((order.totalAmount * 0.1).toFixed(2)) : 0;
      const profit = isDelivered ? Number((order.totalAmount * 0.9).toFixed(2)) : 0;
      
      const totalItems = order.items
        ? order.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
        : 0;

      const dateStr = order.createdAt 
        ? new Date(order.createdAt).toISOString().replace(/T/, ' ').replace(/\..+/, '') 
        : 'N/A';

      // Helper function to escape special characters for CSV format
      const cleanCell = (val: any) => {
        const str = String(val ?? '').replace(/"/g, '""');
        return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
      };

      return [
        cleanCell(order._id),
        cleanCell(dateStr),
        cleanCell(order.restaurantId?.name || 'Deleted Restaurant'),
        cleanCell(order.customerId?.name || 'Deleted Customer'),
        totalItems,
        order.totalAmount,
        cleanCell(order.orderStatus),
        commission,
        profit,
      ].join(',');
    });

    const csvContent = [csvHeader, ...csvRows].join('\n');

    // Return the response as a downloadable attachment
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=DecentralBites_Sales_Report_${new Date().toISOString().split('T')[0]}.csv`,
      },
    });
  } catch (error: any) {
    console.error('Export admin CSV error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
