export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Restaurant } from '@/lib/models/Restaurant';
import { getUserFromRequest } from '@/lib/auth';

// Add new item to menu
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const { id } = params;
    const user = getUserFromRequest(req);

    if (!user || user.role !== 'owner' || user.associatedRestaurantId !== id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const { name, price, description, category, image, isVeg } = await req.json();

    if (!name || !price || !category) {
      return NextResponse.json({ error: 'Name, price, and category are required' }, { status: 400 });
    }

    const newItem = {
      name,
      price: Number(price),
      description: description || '',
      category,
      image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600',
      isAvailable: true,
      isVeg: !!isVeg,
    };

    restaurant.menu.push(newItem);
    await restaurant.save();

    return NextResponse.json({ message: 'Menu item added successfully', menu: restaurant.menu }, { status: 201 });
  } catch (error: any) {
    console.error('Add menu item error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Edit menu item
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const { id } = params;
    const user = getUserFromRequest(req);

    if (!user || user.role !== 'owner' || user.associatedRestaurantId !== id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const { itemId, name, price, description, category, image, isAvailable, isVeg } = await req.json();

    if (!itemId) {
      return NextResponse.json({ error: 'Menu Item ID is required' }, { status: 400 });
    }

    const menuItem = restaurant.menu.id(itemId);
    if (!menuItem) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    if (name !== undefined) menuItem.name = name;
    if (price !== undefined) menuItem.price = Number(price);
    if (description !== undefined) menuItem.description = description;
    if (category !== undefined) menuItem.category = category;
    if (image !== undefined) menuItem.image = image;
    if (isAvailable !== undefined) menuItem.isAvailable = !!isAvailable;
    if (isVeg !== undefined) menuItem.isVeg = !!isVeg;

    await restaurant.save();

    return NextResponse.json({ message: 'Menu item updated successfully', menu: restaurant.menu });
  } catch (error: any) {
    console.error('Update menu item error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Delete menu item
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const { id } = params;
    const user = getUserFromRequest(req);

    if (!user || user.role !== 'owner' || user.associatedRestaurantId !== id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const itemId = req.nextUrl.searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json({ error: 'Menu Item ID is required' }, { status: 400 });
    }

    const menuItem = restaurant.menu.id(itemId);
    if (!menuItem) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    // Pull or remove the subdocument
    restaurant.menu.pull(itemId);
    await restaurant.save();

    return NextResponse.json({ message: 'Menu item deleted successfully', menu: restaurant.menu });
  } catch (error: any) {
    console.error('Delete menu item error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
