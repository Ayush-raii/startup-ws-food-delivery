import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // Allows null/missing email values for staff members
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true, // Allows missing phone numbers for some users
      trim: true,
    },
    password: {
      type: String,
      // Required for customer/owner, but not for staff since they use direct phone login
    },
    role: {
      type: String,
      enum: ['customer', 'owner', 'staff', 'admin'],
      required: true,
    },
    savedAddresses: {
      type: [String],
      default: [],
    },
    associatedRestaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    verificationOtp: {
      type: String,
      default: null,
    },
    verificationOtpExpires: {
      type: Date,
      default: null,
    },
    resetOtp: {
      type: String,
      default: null,
    },
    resetOtpExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent compiling model query on hot reload
export const User = models.User || model('User', UserSchema);
