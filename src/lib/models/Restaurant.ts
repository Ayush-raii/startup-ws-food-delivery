import mongoose, { Schema, model, models } from 'mongoose';

const MenuItemSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    enum: ['Starters', 'Main Course', 'Desserts'],
    required: true,
  },
  image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600',
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  isVeg: {
    type: Boolean,
    default: true,
  },
});

const RestaurantSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    bannerImage: {
      type: String,
      required: true,
    },
    cuisineTags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'pending',
    },
    latitude: {
      type: Number,
      default: 28.6139,
    },
    longitude: {
      type: Number,
      default: 77.2090,
    },
    ownerPhone: {
      type: String,
      default: '',
    },
    menu: {
      type: [MenuItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Restaurant = models.Restaurant || model('Restaurant', RestaurantSchema);
export { MenuItemSchema };
