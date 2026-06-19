# Decentralized Merchant-Led Food Delivery Application Plan

This plan describes the implementation of a decentralized, merchant-led food delivery application using **Next.js (App Router)**, **Tailwind CSS**, and **MongoDB/Mongoose**. 

Unlike standard food delivery apps, there is no central delivery fleet; each restaurant registers, manages, and assigns orders to its own internal delivery staff.

## User Review Required

> [!IMPORTANT]
> **Aesthetic Design System:**
> - The UI will feature a high-end, clean flat design with premium whitespace, subtle shadows (`shadow-sm`, `shadow-md`), and modern typography (using Google Fonts *Geist* or *Inter*).
> - High-contrast indicators (e.g., Veg=Green, Non-Veg=Red).
> - Curated color palettes with HSL-based colors rather than plain primaries (e.g., premium warm amber/orange primary, charcoal text, slate backgrounds).

> [!WARNING]
> **Database Requirement:**
> - The application assumes a MongoDB instance is available. We will set the connection string in `.env.local` to `MONGODB_URI=mongodb://localhost:27017/merchant-delivery`.
> - To make testing seamless, we will write a database seeding utility that automatically runs on application start (or a `/api/seed` route) if the database is empty, pre-populating a set of default users (customer, owner, staff), restaurants, and menu items.

---

## Technical Stack & Architecture

- **Framework**: Next.js 14+ (App Router, Server Actions or Route Handlers)
- **Styling**: Tailwind CSS, Lucide React (Icons), HTML5 Audio API for owner alerts
- **Database**: MongoDB via Mongoose
- **Auth**: JWT-based session stored in secure, HttpOnly cookies for role-based middleware routing
- **State Management**: React Context (Cart Context, Auth Context)
- **Real-Time Updates**: Fast-polling client hooks (every 3 seconds) for checking order status changes, new incoming orders, and OTP validation. This is highly reliable, scales gracefully for demo purposes, and does not require complex WebSocket handshakes that can break on various hostings.

---

## Database Schemas (Mongoose)

### 1. User Schema
Represents customers, restaurant owners, and delivery staff.
```typescript
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // BCrypt hashed
  role: { type: String, enum: ['customer', 'owner', 'staff'], required: true },
  savedAddresses: [{ type: String }], // Array of address strings
  associatedRestaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', default: null } // Set for owner and staff
}
```

### 2. Restaurant Schema
Represents a food merchant.
```typescript
{
  name: { type: String, required: true },
  bannerImage: { type: String, required: true },
  cuisineTags: [{ type: String }],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  menu: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    category: { type: String, enum: ['Starters', 'Main Course', 'Desserts'], required: true },
    image: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
    isVeg: { type: Boolean, default: true }
  }]
}
```

### 3. Order Schema
Track orders and merchant-led assignments.
```typescript
{
  customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  assignedStaffId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  items: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    isVeg: { type: Boolean, default: true }
  }],
  totalAmount: { type: Number, required: true },
  deliveryAddress: { type: String, required: true },
  orderStatus: { 
    type: String, 
    enum: ['Placed', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered', 'Rejected'], 
    default: 'Placed' 
  },
  deliveryOTP: { type: String, default: null }, // Securely generated 4-digit code (e.g. "4921")
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

---

## Proposed Changes

### Configuration & Bootstrap

#### [NEW] [.env.local](file:///c:/Users/ayush/OneDrive/Desktop/antigravity/food%20app/.env.local)
Database URL and JWT signing secrets:
```env
MONGODB_URI=mongodb://localhost:27017/merchant-delivery
JWT_SECRET=super-secret-key-for-food-delivery-decentralized-app-2026
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Backend API Design (`src/app/api/...`)

- `POST /api/auth/register` - Create customer or staff/owner accounts.
- `POST /api/auth/login` - Authenticates user, signs JWT, sets HttpOnly cookie.
- `POST /api/auth/logout` - Clears the authentication cookie.
- `GET /api/auth/me` - Verifies cookie JWT and returns logged-in user profile.
- `GET /api/restaurants` - List active restaurants.
- `GET /api/restaurants/[id]` - Details + menu of a specific restaurant.
- `POST /api/restaurants/[id]/menu` - [Owner only] CRUD operations on menu.
- `GET /api/staff` - [Owner only] Fetch list of delivery staff registered under the owner's restaurant.
- `POST /api/staff` - [Owner only] Register new delivery staff under their restaurant.
- `GET /api/orders` - Get orders based on role:
  - **Customer**: Fetch customer's orders.
  - **Owner**: Fetch restaurant's orders.
  - **Staff**: Fetch orders assigned to staff.
- `POST /api/orders` - [Customer only] Create new order.
- `PATCH /api/orders/[id]` - Update status (Accept, Reject, Preparing).
- `PATCH /api/orders/[id]/assign` - [Owner only] Assign an online staff member (moves status to `Out for Delivery` and generates 4-digit OTP).
- `POST /api/orders/verify-otp` - [Staff only] Enter and verify customer's 4-digit OTP. If matching, update order status to `Delivered`.

### Database Seeding Utility

#### [NEW] [src/lib/db.ts](file:///c:/Users/ayush/OneDrive/Desktop/antigravity/food%20app/src/lib/db.ts)
Mongoose connection helper with connection caching and auto-seeding hook on connection.

#### [NEW] [src/lib/seed.ts](file:///c:/Users/ayush/OneDrive/Desktop/antigravity/food%20app/src/lib/seed.ts)
Seed database function that populates default records if the User database is empty:
- Customer: `customer@example.com` / `password123`
- Owner: `owner@example.com` / `password123`
- Staff: `staff@example.com` / `password123`
- Seeding 3 restaurants with realistic menus, banner images, and pricing.

---

## Front-End Dashboards & Views

### 1. Authentication Layer
- **Login / Signup Pages** (`src/app/login/page.tsx`, `src/app/register/page.tsx`): Minimal, card-based flat design. Role dropdown selection for Signup. On success, redirects to the correct subfolder dashboard using the role retrieved.
- **Middleware**: A Next.js middleware checking JWT role to protect `/customer/*`, `/restaurant/*`, and `/staff/*` paths.

### 2. Customer View
- **Landing Page / Dashboard** (`src/app/customer/dashboard/page.tsx`):
  - Banner slider (Offer banners).
  - Search bar + quick category chips (Starters, Main Course, Desserts, Veg, Non-Veg).
  - Filters: Cost (Low to High), Rating (4.0+), Veg-only toggle.
  - List of restaurants with cuisine tags, ratings, and delivery times.
- **Restaurant Details / Menu Page** (`src/app/customer/restaurant/[id]/page.tsx`):
  - Category sections.
  - Veg/Non-Veg indicators.
  - Add to cart buttons with quantity controls.
  - Persistent sliding Cart Panel overlay with live summary.
- **Checkout Page** (`src/app/checkout/page.tsx`):
  - Address selection (or enter new address).
  - Itemized receipt breakdown.
  - GST (18%) + Delivery Fee (flat restaurant rate, e.g. ₹40).
  - Button to "Place Order" (simulates payment gateway, redirects to tracking).
- **Order Tracking Page** (`src/app/order/[id]/page.tsx`):
  - Real-time status tracker (Placed -> Accepted -> Preparing -> Out for Delivery -> Delivered).
  - Prominent display of 4-digit secure OTP once state is `Out for Delivery`.

### 3. Restaurant Owner View (`src/app/restaurant/dashboard/page.tsx`)
- **Order Management Tab**:
  - Live orders panel. Plays notification sound (ding/alert) on new "Placed" order.
  - Real-time status update controls: "Accept Order", "Reject Order", "Start Cooking" (Preparing), "Ready to Dispatch" (ready for delivery staff assignment).
- **Menu Management Tab**:
  - Grid of current menu items.
  - Add/Edit dialog form. Toggle item availability. Delete button.
- **Delivery Staff Tab**:
  - Register new staff account form.
  - List of existing delivery staff with status (Active/Offline).
- **Dispatch Panel**:
  - Shown when an order is "Preparing" / "Ready to Dispatch".
  - Dropdown listing all delivery staff linked to the restaurant.
  - "Assign & Dispatch" button.

### 4. Delivery Staff View (`src/app/staff/dashboard/page.tsx`)
- Mobile-first dashboard layout.
- List of assigned delivery tasks.
- For active orders: Customer name, phone, delivery address, and Google Maps deep link (`https://www.google.com/maps/search/?api=1&query=...`).
- "Confirm Delivery" section with a 4-digit input field for customer OTP.
- OTP check triggers instant update, closing the delivery task.

---

## Verification Plan

### Automated Steps
1. Verify package compilation and compilation error safety.
2. Confirm API routes function correctly by requesting test endpoints.

### Manual Verification Flow
We will perform a full walkthrough script covering the entire lifecycle:
1. **User Signups/Logins**: Access `/login` and test Customer, Owner, and Staff role redirections.
2. **Order Placement**: 
   - Log in as Customer, add food items to cart, head to checkout, add address, and place order.
   - Redirects to `/order/[orderId]` showing status "Placed".
3. **Merchant Acceptance & Prep**:
   - Log in as Owner. Audio ding plays.
   - Accept the order (status becomes "Accepted").
   - Click "Start Cooking" (status becomes "Preparing").
   - Click "Ready to Dispatch".
4. **Staff Assignment**:
   - Select the seeded "Staff Member" from the dropdown.
   - Click "Assign & Dispatch" (status becomes "Out for Delivery", and a 4-digit OTP is generated).
5. **Customer Tracking Check**:
   - Return to Customer's tracking page. Verify that order is "Out for Delivery" and that the 4-digit OTP (e.g. `1234`) is clearly visible.
6. **Delivery Handshake**:
   - Log in as Staff. See the active delivery with customer address and Google Maps button.
   - Enter the correct 4-digit OTP. Click "Verify".
   - Verify status updates to "Delivered" for Customer, Owner, and Staff.

---

## AI Menu Scanner & Order Preparation Timers (New Feature)

### 1. Backend AI Menu Scanner Route

#### [NEW] [src/app/api/upload-menu/route.ts](file:///c:/Users/ayush/OneDrive/Desktop/antigravity/food%20app/src/app/api/upload-menu/route.ts)
- Parse base64/binary image from POST request.
- Initialize `@google/generative-ai` with `gemini-2.5-flash`.
- Instruct Gemini via a strict JSON Schema prompt to output categories restricted to `['Starters', 'Main Course', 'Desserts']` (to match the DB constraints) and veg/non-veg flags matching the database.
- **Exponential Backoff**: Wrap the API call in a `while` loop (up to 5 attempts) to handle status `429` (Rate limit exceeded) and `503` (Service unavailable). Wait duration starts at 1.5s and doubles with each failure.

### 2. Frontend AI Menu Scanner UI Component

#### [MODIFY] [src/app/restaurant/dashboard/page.tsx](file:///c:/Users/ayush/OneDrive/Desktop/antigravity/food%20app/src/app/restaurant/dashboard/page.tsx)
- Introduce an elegant "AI Menu Scanner" panel inside the Menu Management section.
- Drag & drop zone or file input to upload PNG/JPEG.
- Showing clean animated loading spinner: "AI is scanning your menu, please wait...".
- Editable grid / table to review extracted items: Name, Price, Description, Category (dropdown selection to edit), Food Type (Veg/Non-Veg).
- "Confirm & Save Menu" button that performs multiple bulk-POST requests (or a bulk endpoint call) to save the parsed items to `/api/restaurants/[id]/menu`.

### 3. Order Countdown Timers & Notifications

#### [MODIFY] [src/app/restaurant/dashboard/page.tsx](file:///c:/Users/ayush/OneDrive/Desktop/antigravity/food%20app/src/app/restaurant/dashboard/page.tsx)
- Calculate preparation remaining time for each active order (5-minute limit since order placement `createdAt` timestamp).
- Display countdown in minutes:seconds.
- **Urgent Warning Alert**: If remaining time is under 30 seconds, display high-priority notification flashing badge: "🚨 Time limit almost up! Prepare & deliver immediately!".
- **Order Delayed Alert**: If remaining time drops <= 0, display: "🚨 Order Delayed! Long delay detected."
- **Alert Notification**: On polling new orders in `Placed` state, show visual warning/alert: "🔔 New Order Placed! Attend immediately."

#### [MODIFY] [src/app/order/[id]/page.tsx](file:///c:/Users/ayush/OneDrive/Desktop/antigravity/food%20app/src/app/order/%5Bid%5D/page.tsx)
- Add countdown timer matching the 5-minute restaurant preparation window.
- **Polite Customer Delay Message**:
  - If the timer drops below 30 seconds (or is expired), display a friendly, polite message on the customer's page:
    *"We notice a slight delay in preparing your order. Our team is working to get it to you as quickly as possible. Your delivery may be a bit late. We apologize for the inconvenience! 🙏"*

---

## Verification Plan for New Features

### Backend AI Scanner Test
- Mock or simulate Gemini requests with simulated 429/503 responses to verify backoff retry logic.

### UI Integration
- Test menu scanner upload with sample menu image.
- Verify that parsed items populate the editable grid. Make edits and save, verifying DB updates.
- Verify order timer countdowns, and verify that the polite customer warning displays correctly when an order timer drops low.
