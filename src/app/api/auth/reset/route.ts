export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    // Force reset the database and seed the new multi-merchant accounts
    await seedDatabase(true);
    return NextResponse.json({ message: 'Database reset to demo defaults successfully' });
  } catch (error: any) {
    console.error('Reset database error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
