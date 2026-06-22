import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from './models/User';
import { Restaurant } from './models/Restaurant';

export async function seedDatabase(forceReset: boolean = false) {
  try {
    if (forceReset) {
      console.log('Force resetting database... Dropping existing collections');
      try {
        await User.collection.drop();
      } catch (e) {}
      try {
        await Restaurant.collection.drop();
      } catch (e) {}
      
      // Also drop Order collection if it exists
      try {
        const db = mongoose.connection.db;
        if (db) {
          const collections = await db.listCollections({ name: 'orders' }).toArray();
          if (collections.length > 0) {
            await db.collection('orders').drop();
          }
        }
      } catch (e) {}
    } else {
      // Check if seeding is already done by checking for Users
      const userCount = await User.countDocuments();
      if (userCount > 0) {
        return;
      }
    }

    console.log('Seeding database with default records...');

    // 1. Create Restaurants
    const restaurantsData = [
      {
        name: 'Royal India',
        bannerImage: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=1200',
        cuisineTags: ['North Indian', 'Mughlai', 'Tandoor'],
        status: 'active',
        latitude: 28.6139,
        longitude: 77.2090,
        menu: [
          {
            name: 'Paneer Tikka',
            price: 240,
            description: 'Spiced cottage cheese cubes grilled in a traditional tandoor clay oven.',
            category: 'Starters',
            image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=600',
            isAvailable: true,
            isVeg: true,
          },
          {
            name: 'Samosa Duo',
            price: 90,
            description: 'Crispy pastry filled with spiced potatoes and green peas.',
            category: 'Starters',
            image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=600',
            isAvailable: true,
            isVeg: true,
          },
          {
            name: 'Butter Chicken',
            price: 380,
            description: 'Tender chicken pieces cooked in a creamy tomato sauce infused with spices.',
            category: 'Main Course',
            image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=600',
            isAvailable: true,
            isVeg: false,
          },
          {
            name: 'Paneer Butter Masala',
            price: 320,
            description: 'Rich cottage cheese curry cooked in a smooth tomato and cashew paste gravy.',
            category: 'Main Course',
            image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=600',
            isAvailable: true,
            isVeg: true,
          },
          {
            name: 'Garlic Naan',
            price: 60,
            description: 'Leavened flatbread brushed with garlic and butter.',
            category: 'Main Course',
            image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=600',
            isAvailable: true,
            isVeg: true,
          },
          {
            name: 'Gulab Jamun',
            price: 120,
            description: 'Warm, soft milk-solid dumplings soaked in aromatic cardamom sugar syrup.',
            category: 'Desserts',
            image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=600',
            isAvailable: true,
            isVeg: true,
          },
        ],
      },
      {
        name: 'The Burger Lab',
        bannerImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=1200',
        cuisineTags: ['Gourmet Burgers', 'American', 'Fast Food'],
        status: 'active',
        latitude: 28.6250,
        longitude: 77.2150,
        menu: [
          {
            name: 'Cheesy Fries',
            price: 150,
            description: 'Golden, crispy French fries smothered in hot liquid cheddar cheese.',
            category: 'Starters',
            image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=600',
            isAvailable: true,
            isVeg: true,
          },
          {
            name: 'Crispy Onion Rings',
            price: 130,
            description: 'Deep-fried battered sweet white onion rings served with BBQ sauce dip.',
            category: 'Starters',
            image: 'https://images.unsplash.com/photo-1639024471283-2bc7b3c6a267?auto=format&fit=crop&q=80&w=600',
            isAvailable: true,
            isVeg: true,
          },
          {
            name: 'Double Smash Cheeseburger',
            price: 280,
            description: 'Two smashed beef patties, cheddar cheese, pickles, and signature house burger sauce.',
            category: 'Main Course',
            image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600',
            isAvailable: true,
            isVeg: false,
          },
          {
            name: 'Spicy Paneer Burger',
            price: 220,
            description: 'Crispy fried cottage cheese patty with spicy garlic mayo, lettuce, and onions.',
            category: 'Main Course',
            image: 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?auto=format&fit=crop&q=80&w=600',
            isAvailable: true,
            isVeg: true,
          },
          {
            name: 'Chocolate Lava Cake',
            price: 160,
            description: 'Warm chocolate cake with a gooey, molten chocolate center.',
            category: 'Desserts',
            image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=600',
            isAvailable: true,
            isVeg: true,
          },
        ],
      },
      {
        name: 'Taco Fiesta',
        bannerImage: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&q=80&w=1200',
        cuisineTags: ['Mexican', 'Tex-Mex', 'Tacos'],
        status: 'active',
        latitude: 28.5950,
        longitude: 77.1950,
        menu: [
          {
            name: 'Classic Loaded Nachos',
            price: 180,
            description: 'Tortilla chips topped with warm cheese sauce, refried beans, sour cream, and pico de gallo.',
            category: 'Starters',
            image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&q=80&w=600',
            isAvailable: true,
            isVeg: true,
          },
          {
            name: 'Chipotle Chicken Tacos (3 Pcs)',
            price: 260,
            description: 'Soft corn tortillas with grilled chicken, chipotle salsa, onions, cilantro, and lime.',
            category: 'Main Course',
            image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&q=80&w=600',
            isAvailable: true,
            isVeg: false,
          },
          {
            name: 'Three-Cheese Quesadilla',
            price: 210,
            description: 'Toasted flour tortilla stuffed with melted Monterey Jack, Cheddar, and Mozzarella.',
            category: 'Main Course',
            image: 'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?auto=format&fit=crop&q=80&w=600',
            isAvailable: true,
            isVeg: true,
          },
          {
            name: 'Churros with Caramel',
            price: 140,
            description: 'Crispy fried pastry dough sticks dusted in cinnamon sugar, served with dulce de leche dip.',
            category: 'Desserts',
            image: 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?auto=format&fit=crop&q=80&w=600',
            isAvailable: true,
            isVeg: true,
          },
        ],
      },
    ];

    const createdRestaurants = await Restaurant.insertMany(restaurantsData);
    console.log(`Seeded ${createdRestaurants.length} restaurants.`);

    const royalIndia = createdRestaurants.find((r) => r.name === 'Royal India');
    const burgerLab = createdRestaurants.find((r) => r.name === 'The Burger Lab');
    const tacoFiesta = createdRestaurants.find((r) => r.name === 'Taco Fiesta');

    // 2. Hash Password for default users
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync('password123', salt);
    const adminHashedPassword = bcrypt.hashSync('admin123', salt);

    // 3. Create Default Users (1 customer, 3 owners, 3 staff riders, 1 admin)
    const usersData = [
      {
        name: 'Alice Customer',
        email: 'customer@example.com',
        password: hashedPassword,
        role: 'customer',
        savedAddresses: ['102, Blue Heights, Park Street, New Delhi', 'Block 4B, Sector 62, Noida'],
        associatedRestaurantId: null,
        isVerified: true,
      },
      // Admin
      {
        name: 'System Admin',
        email: 'admin@example.com',
        password: adminHashedPassword,
        role: 'admin',
        associatedRestaurantId: null,
        isVerified: true,
      },
      // Owners
      {
        name: 'Royal India Owner',
        email: 'owner@example.com',
        password: hashedPassword,
        role: 'owner',
        associatedRestaurantId: royalIndia ? royalIndia._id : null,
        isVerified: true,
      },
      {
        name: 'Burger Lab Owner',
        email: 'burger_owner@example.com',
        password: hashedPassword,
        role: 'owner',
        associatedRestaurantId: burgerLab ? burgerLab._id : null,
        isVerified: true,
      },
      {
        name: 'Taco Fiesta Owner',
        email: 'taco_owner@example.com',
        password: hashedPassword,
        role: 'owner',
        associatedRestaurantId: tacoFiesta ? tacoFiesta._id : null,
        isVerified: true,
      },
      // Rider Staff
      {
        name: 'John Driver (Royal India)',
        phone: '9876543210',
        role: 'staff',
        associatedRestaurantId: royalIndia ? royalIndia._id : null,
        isVerified: true,
      },
      {
        name: 'Bob Burger-Rider (Burger Lab)',
        phone: '9876543211',
        role: 'staff',
        associatedRestaurantId: burgerLab ? burgerLab._id : null,
        isVerified: true,
      },
      {
        name: 'Taco Rider (Taco Fiesta)',
        phone: '9876543212',
        role: 'staff',
        associatedRestaurantId: tacoFiesta ? tacoFiesta._id : null,
        isVerified: true,
      },
    ];

    const createdUsers = await User.insertMany(usersData);
    console.log(`Seeded ${createdUsers.length} users.`);
  } catch (err: any) {
    if (err.code === 11000) {
      console.log('Database already seeded (concurrent initialization).');
      return;
    }
    console.error('Seeding database error:', err);
  }
}
