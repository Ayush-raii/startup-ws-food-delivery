export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { SystemSettings } from '@/lib/models/SystemSettings';
import { getUserFromRequest } from '@/lib/auth';

async function getOrCreateDeliveryConfig() {
  let config = await SystemSettings.findOne({ key: 'delivery_config' });
  if (!config) {
    config = await SystemSettings.create({
      key: 'delivery_config',
      deliveryFreeDistance: 4,
      deliveryBaseFee: 40,
      deliveryRatePerKm: 10,
    });
  }
  return config;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const config = await getOrCreateDeliveryConfig();
    return NextResponse.json({ config });
  } catch (error: any) {
    console.error('Fetch delivery config error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();
    const user = getUserFromRequest(req);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { deliveryFreeDistance, deliveryBaseFee, deliveryRatePerKm } = await req.json();

    const config = await getOrCreateDeliveryConfig();

    if (deliveryFreeDistance !== undefined) {
      config.deliveryFreeDistance = Number(deliveryFreeDistance);
    }
    if (deliveryBaseFee !== undefined) {
      config.deliveryBaseFee = Number(deliveryBaseFee);
    }
    if (deliveryRatePerKm !== undefined) {
      config.deliveryRatePerKm = Number(deliveryRatePerKm);
    }

    await config.save();

    return NextResponse.json({ message: 'Delivery settings updated successfully', config });
  } catch (error: any) {
    console.error('Update delivery config error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
