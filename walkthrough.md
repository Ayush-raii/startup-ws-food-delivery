# Decentralized Merchant-Led Food Delivery App - Walkthrough

This application introduces a **decentralized, merchant-led delivery architecture** where restaurants manage their own internal delivery staff instead of relying on a centralized driver network like Zomato/Swiggy.

---

## 🛠️ Tech Stack & Dependencies

- **Frontend & Backend API**: [Next.js 14 (App Router)](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database ORM**: [Mongoose](https://mongoosejs.com/) connecting to MongoDB Atlas
- **Authentication**: JWT-based secure sessions stored in HttpOnly cookies, supporting email/password for customers/owners, and passwordless phone login for riders.
- **Micro-Animations & Icons**: [Lucide React](https://lucide.dev/)
- **Audio alerting**: Synthesized locally via the HTML5 Web Audio API (cross-platform, zero asset load failure risk).

---

## 🏗️ Core Architecture & Multi-Merchant Isolation

To support multiple independent restaurant merchants, the app enforces strict multi-tenancy isolation at the database, session, and route-controller levels:

### 1. Database Connection, Seeding & Resetting
- **Connector** ([db.ts](file:///c:/Users/ayush/OneDrive/Desktop/antigravity/food%20app/src/lib/db.ts)): Caches database connections in development and integrates an auto-seeding hook on initialization.
- **Reset API** ([route.ts](file:///c:/Users/ayush/OneDrive/Desktop/antigravity/food%20app/src/app/api/auth/reset/route.ts)): A clean administrative route to drop collections and reset the database to clean demo seeds.
- **Idempotent Seed Script** ([seed.ts](file:///c:/Users/ayush/OneDrive/Desktop/antigravity/food%20app/src/lib/seed.ts)): Pre-populates clean accounts, including a common customer, three unique restaurant owners, and three corresponding riders:
  - **Common Customer**: `customer@example.com` / `password123`
  - **Royal India**: Owner: `owner@example.com` | Rider Phone: `9876543210`
  - **The Burger Lab**: Owner: `burger_owner@example.com` | Rider Phone: `9876543211`
  - **Taco Fiesta**: Owner: `taco_owner@example.com` | Rider Phone: `9876543212`
  - All default owner passwords are set to `password123` for convenience.

### 2. Multi-Tenancy Logic & Controllers
- **User Schema** ([User.ts](file:///c:/Users/ayush/OneDrive/Desktop/antigravity/food%20app/src/lib/models/User.ts)): Connects owners and staff directly to a restaurant ID using the `associatedRestaurantId` reference.
- **Isolated API Views**:
  - `/api/orders` fetches and filters orders dynamically: owners only see orders placed for their restaurant, and staff only see orders assigned to them.
  - `/api/staff` fetches staff registered specifically under the logged-in owner's restaurant ID.
  - `/api/restaurants/[id]/menu` verifies that the modifying user is an owner who is associated with that exact restaurant ID before permitting menu updates (POST/PUT/DELETE).

---

## 🖥️ Dashboards & User Flows

1. **Gatekeeper Authentication** ([login/page.tsx](file:///c:/Users/ayush/OneDrive/Desktop/antigravity/food%20app/src/app/login/page.tsx), [register/page.tsx](file:///c:/Users/ayush/OneDrive/Desktop/antigravity/food%20app/src/app/register/page.tsx), [middleware.ts](file:///c:/Users/ayush/OneDrive/Desktop/antigravity/food%20app/src/middleware.ts)):
   - Unified credentials login for customers/owners.
   - Separate phone number tab for riders.
   - Database Reset trigger button to re-run seed scripts directly from the UI.
   - Grouped autofill logins for all 3 merchants (Royal India, Burger Lab, and Taco Fiesta) to facilitate isolation testing.

2. **Customer Journey**:
   - **Dashboard** ([customer/dashboard/page.tsx](file:///c:/Users/ayush/OneDrive/Desktop/antigravity/food%20app/src/app/customer/dashboard/page.tsx)): Offers slider, category chips, rating filters, search, and a list of active orders.
   - **Menu Page** ([customer/restaurant/[id]/page.tsx](file:///c:/Users/ayush/OneDrive/Desktop/antigravity/food%20app/src/app/customer/restaurant/[id]/page.tsx)): Add/remove triggers, category scrollers, and sliding persistent cart summary.
   - **Checkout** ([checkout/page.tsx](file:///c:/Users/ayush/OneDrive/Desktop/antigravity/food%20app/src/app/checkout/page.tsx)): Address inputs, payment selectors, and tax calculator.
   - **Tracking** ([order/[id]/page.tsx](file:///c:/Users/ayush/OneDrive/Desktop/antigravity/food%20app/src/app/order/[id]/page.tsx)): Displays timeline, rider details, and the 4-digit verification OTP once the order shifts to "Out for Delivery".

3. **Merchant Control**:
   - **Owner Dashboard** ([restaurant/dashboard/page.tsx](file:///c:/Users/ayush/OneDrive/Desktop/antigravity/food%20app/src/app/restaurant/dashboard/page.tsx)):
     - Synthesized chime rings when new orders arrive.
     - Controls to accept and start preparing.
     - Dropdown listing only the riders registered under the owner's restaurant.
     - Add, edit, toggle availability, or delete items from the menu.
     - Register riders by Name and Phone Number.

4. **Rider Companion**:
   - **Staff Dashboard** ([staff/dashboard/page.tsx](file:///c:/Users/ayush/OneDrive/Desktop/antigravity/food%20app/src/app/staff/dashboard/page.tsx)):
     - Mobile-first layout showing active deliveries.
     - Link to launch directions in Google Maps, and click-to-call button.
     - Text field to input the customer's 4-digit verification OTP. Correct OTP updates the order to "Delivered".

---

## 🚦 Multi-Tenant Isolation & Verification Instructions

Follow these steps to test multi-restaurant classification and verify correct end-to-end operation:

1. **Launch the Server**:
   Inside `c:\Users\ayush\OneDrive\Desktop\antigravity\food app`, run:
   ```bash
   npm run dev
   ```
2. **Access the Web Interface**:
   Open browser at `http://localhost:3000` (which redirects to `/login`).

3. **Reset Database**:
   - On the login page, click the **Reset Database** button to clear old testing state and seed the clean multi-merchant dataset.

4. **Customer Places Orders at Two Different Restaurants**:
   - Click the **Customer** demo autofill badge and log in.
   - Go to **Royal India**, add Paneer Tikka, and check out to place an order.
   - Go back to the dashboard, go to **The Burger Lab**, add Cheesy Fries, and check out to place a second order.
   - You now have 2 active orders in your customer tracking list.

5. **Verify Isolation between Merchants**:
   - Log out, go to `/login`, and click **Fill Owner** under **Royal India** (`owner@example.com`). Log in.
   - Check the Preparation Queue. You should **only** see the Royal India order (Paneer Tikka). The Burger Lab order (Cheesy Fries) is isolated and invisible.
   - Click **Accept Order**, click **🍳 Start Preparing**, select **John Driver** from the dropdown, and click **Dispatch Rider 🚀**.
   - Log out, go back to `/login`, and click **Fill Owner** under **The Burger Lab** (`burger_owner@example.com`). Log in.
   - Check the queue. You should **only** see the Burger Lab order. The Royal India order is invisible.
   - Process this order: accept, prepare, and select **Bob Burger-Rider** from the dropdown to dispatch.

6. **Verify Rider Handshake Isolation**:
   - Log out, go to `/login`, and click **Fill Rider** under **The Burger Lab** (`9876543211`). Log in.
   - You should only see the Burger Lab delivery task.
   - Enter the Burger Lab order's OTP (retrieved from the customer's tracking screen for that order) to complete the delivery handshake.

