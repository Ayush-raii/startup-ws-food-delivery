import mongoose, { Schema, model, models } from 'mongoose';

const OrderItemSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  isVeg: {
    type: Boolean,
    default: true,
  },
});

const OrderSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    assignedStaffId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    deliveryAddress: {
      type: String,
      required: true,
    },
    orderStatus: {
      type: String,
      enum: ['Placed', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered', 'Rejected'],
      default: 'Placed',
    },
    deliveryOTP: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Order = models.Order || model('Order', OrderSchema);
