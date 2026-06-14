# DecentralBites — Login Credentials & Access Info

> All demo accounts are seeded automatically. If accounts stop working, click **Reset Database** on the Login page to re-seed them.

---

## 🌐 Login Pages

| Portal | URL |
|---|---|
| Customer / Owner / Staff | `/login` |
| Admin (separate secure gate) | `/login/admin` |

---

## 👤 Customer Account

| Field | Value |
|---|---|
| **Name** | Alice Customer |
| **Email** | `customer@example.com` |
| **Password** | `password123` |
| **Role** | customer |
| **Redirects to** | `/customer/dashboard` |

---

## 🍽️ Restaurant Owner Accounts

### Royal India
| Field | Value |
|---|---|
| **Email** | `owner@example.com` |
| **Password** | `password123` |
| **Role** | owner |
| **Redirects to** | `/restaurant/dashboard` |

### The Burger Lab
| Field | Value |
|---|---|
| **Email** | `burger_owner@example.com` |
| **Password** | `password123` |
| **Role** | owner |
| **Redirects to** | `/restaurant/dashboard` |

### Taco Fiesta
| Field | Value |
|---|---|
| **Email** | `taco_owner@example.com` |
| **Password** | `password123` |
| **Role** | owner |
| **Redirects to** | `/restaurant/dashboard` |

---

## 🚴 Delivery Staff / Rider Accounts

Staff log in via **phone number** (no password needed) on the **Delivery Rider Staff** tab.

| Restaurant | Phone Number | Redirects to |
|---|---|---|
| Royal India Rider | `9876543210` | `/staff/dashboard` |
| The Burger Lab Rider | `9876543211` | `/staff/dashboard` |
| Taco Fiesta Rider | `9876543212` | `/staff/dashboard` |

---

## 🛡️ Admin Account

Login at `/login/admin` (separate dark-themed portal).

| Field | Value |
|---|---|
| **Email** | `admin@example.com` |
| **Password** | `admin123` |
| **Role** | admin |
| **Redirects to** | `/admin/dashboard` |

---

## 🔄 Resetting Demo Data

If any account fails to log in (e.g. after orders have been placed and data is messy):

1. Go to `/login`
2. Scroll down to **Quick Demo Accounts**
3. Click **Reset Database** button
4. Wait for success message — all accounts and seed data will be restored

---

## 📝 Notes

- All passwords are `password123` except admin which uses `admin123`
- Staff accounts use phone numbers only — no password
- Each restaurant owner can **only see their own** orders and staff (data isolation)
- The admin account can view all restaurants, orders, and users
