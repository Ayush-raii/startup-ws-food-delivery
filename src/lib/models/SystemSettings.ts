import mongoose, { Schema, model, models } from 'mongoose';

const SystemSettingsSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'delivery_config',
    },
    deliveryFreeDistance: {
      type: Number,
      default: 4, // Free up to 4 km
    },
    deliveryBaseFee: {
      type: Number,
      default: 40, // Base fee ₹40
    },
    deliveryRatePerKm: {
      type: Number,
      default: 10, // Additional ₹10 per km
    },
  },
  {
    timestamps: true,
  }
);

export const SystemSettings = models.SystemSettings || model('SystemSettings', SystemSettingsSchema);
