export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Restaurant } from '@/lib/models/Restaurant';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const restaurants = await Restaurant.find({ status: 'active' });
    return NextResponse.json({ restaurants });
  } catch (error: any) {
    console.error('Fetch restaurants error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
