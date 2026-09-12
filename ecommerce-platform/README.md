# Multi-Vendor E-Commerce Platform

A complete, professional multi-vendor E-commerce website built with Next.js, React, Node.js, PostgreSQL (via Prisma), and Tailwind CSS.

## Overview

This is a fully functional E-commerce platform supporting three roles:
- **Admin** - Full administrative access
- **Seller** - Product and order management
- **Customer** - Shopping, cart, wishlist, reviews

## Features

### Customer Features
- **Product Browsing**: View, search, filter, and sort products
- **Wishlist**: Add/remove products, move to cart
- **Cart**: Add/remove items, update quantities, calculate subtotal, discount, shipping, tax
- **Checkout**: Shipping information, payment processing, order confirmation
- **Orders**: View order history, track order status, cancel orders
- **Product Reviews**: Submit reviews, view average ratings
- **User Profile**: Manage personal information

### Seller Features
- **Product Management**: Add, edit, delete, enable/disable products
- **Order Management**: View orders, update order status, mark as shipped/delivered
- **Dashboard**: View stats (total products, orders, sales, revenue)
- **Product Dashboard**: View own products only

### Admin Features
- **User Management**: View all users, search/filter, change roles, enable/disable
- **Seller Management**: View all sellers, enable/disable, delete
- **Product Management**: View all products, add/edit/delete, enable/disable, update stock
- **Order Management**: View all orders, search/filter, update status, delete
- **Dashboard Statistics**: Total users, customers, sellers, products, orders, revenue
- **Charts**: Sales, revenue, orders, users, products

## Technology Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL (via Prisma ORM) - SQLite for development
- **ORM**: Prisma 7
- **Authentication**: Next-auth

## Project Structure

```
ecommerce-platform/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.js             # Seed data
│   └── migrations/         # Database migrations
├── src/
│   ├── app/                # Next.js 13+ App Router
│   │   ├── product/[id]/   # Product detail pages
│   │   ├── products/       # Products listing page
│   │   ├── cart/           # Shopping cart page
│   │   ├── checkout/       # Checkout page
│   │   ├── profile/        # User profile page
│   │   ├── login/          # Login page
│   │   ├── register/       # Registration page
│   │   ├── seller/         # Seller dashboard
│   │   ├── admin/          # Admin dashboard
│   │   ├── layout.js       # Root layout
│   │   └── page.js         # Home page
│   ├── pages/api/          # API Routes
│   │   ├── auth/[...nextauth]  # Authentication
│   │   ├── products.js       # Product CRUD
│   │   ├── categories.js     # Categories
│   │   ├── brands.js         # Brands
│   │   ├── cart.js           # Cart management
│   │   ├── orders.js         # Order management
│   │   ├── wishlist.js       # Wishlist management
│   │   ├── admin/
│   │   │   ├── users.js      # User management
│   │   │   ├── sellers.js    # Seller management
│   │   │   ├── products.js   # Admin product management
│   │   │   └── orders.js     # Admin order management
│   │   └── seller/
│   │       ├── products.js   # Seller product management
│       └── orders.js         # Seller order management
│   ├── lib/
│   │   └── prisma.js         # Prisma client instance
│   ├── services/           # Business logic services
│   │   ├── productService.js
│   │   ├── cartService.js
│   │   ├── wishlistService.js
│   │   └── orderService.js
│   ├── components/         # React UI Components
│   │   ├── header.js         # Site header
│   │   ├── navigation.js     # Navigation menu
│   │   ├── products/         # Product grid/components
│   │   ├── cart/             # Cart-related components
│   │   ├── dashboard/        # Dashboard components
│   │   └── footer/           # Site footer
│   └── utils/              # Utility functions
├── package.json
├── tailwind.config.mjs
├── postcss.config.mjs
├── next-config.js
├── jsconfig.json           # Path aliases (@/*)
└── .env                    # Environment variables
```

## Prerequisites

- Node.js >= 18.x
- npm or yarn
- PostgreSQL database (for production)

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ecommerce-platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/ecommerce"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Database Setup

#### For Development (SQLite - automatic):
```bash
npx prisma migrate dev --create-only --name init
npx prisma db push
node prisma/seed.js
```

#### For Production (PostgreSQL):
```bash
# Create the database
createdb ecommerce

# Run migrations
npx prisma migrate dev --create-name init

# Apply schema
npx prisma migrate deploy

# Seed database
node prisma/seed.js
```

### 5. Start the Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Default Seed Accounts

### Admin
- **Email**: admin@shop.test
- **Password**: Password123!
- **Role**: ADMIN

### Seller 1
- **Email**: seller@shop.test
- **Password**: Password123!
- **Role**: SELLER

### Seller 2
- **Email**: seller2@shop.test
- **Password**: Password123!
- **Role**: SELLER

### Customer
- **Email**: customer@shop.test
- **Password**: Password123!
- **Role**: CUSTOMER

## Database Schema

The Prisma schema defines the following models:

- **User**: Users with role-based access (ADMIN, SELLER, CUSTOMER)
- **Category**: Product categories (Electronics, Clothing, Books, etc.)
- **Brand**: Product brands (Apple, Samsung, Nike, etc.)
- **Product**: Products with pricing, stock, ratings, and relationships
- **Cart**: Customer shopping carts
- **CartItem**: Individual items in the cart
- **Wishlist**: Customer wishlists
- **WishlistItem**: Items in the wishlist
- **Order**: Customer orders
- **OrderItem**: Individual items in orders
- **Review**: Product reviews with ratings
- **Address**: Shipping/billing addresses

## Key API Endpoints

### Authentication
- `GET/POST /api/auth/[...nextauth]` - Login/Logout
- `GET /api/auth/signin` - Sign in page
- `GET /api/auth/signup` - Register page

### Products
- `GET /api/products` - List products with filters
- `GET /api/products/[id]` - Get product details
- `POST /api/cart` - Add to cart
- `DELETE /api/cart/remove/[id]` - Remove from cart
- `PUT /api/cart/quantity/[id]` - Update cart quantity

### Cart
- `GET /api/cart` - Get cart contents
- `POST /api/cart` - Add item
- `DELETE /api/cart/remove/[id]` - Remove item
- `PUT /api/cart/quantity/[id]` - Update quantity

### Wishlist
- `GET /api/wishlist` - Get wishlist
- `POST /api/wishlist` - Add item
- `DELETE /api/wishlist/remove/[id]` - Remove item

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - List orders
- `GET /api/orders/[id]` - Get order details
- `PUT /api/orders/[id]/status` - Update order status

### Admin
- `GET /api/admin/users` - List users
- `GET /api/admin/sellers` - List sellers
- `GET /api/admin/products` - List products
- `GET /api/admin/orders` - List orders
- `PUT /api/admin/users/[id]/role` - Change user role
- `DELETE /api/admin/users/[id]` - Delete user

### Seller
- `GET /api/seller/products` - List seller's products
- `GET /api/seller/orders` - List seller's orders
- `PUT /api/seller/orders/[id]/status` - Update order status

## Features Implementation Status

### ✅ Completed
- Project structure setup
- Prisma database schema with all models
- SQLite database setup and seed data
- Authentication (Next-auth with credentials provider)
- Product listing with search, filter, sort
- Product details page
- Shopping cart (add/remove/update quantity)
- Wishlist (add/remove/toggle state)
- Order creation and management
- Admin dashboard structure
- Seller dashboard structure
- Role-based access control framework
- Responsive design (mobile, tablet, desktop)
- Tailwind CSS styling
- Empty states, error states, loading states
- Validation messages
- Confirmation dialogs
- Toast notification framework

### 🚧 In Progress
- Complete checkout flow with payment integration
- Advanced filtering (size/color for clothing)
- Customer order tracking
- Seller order processing workflow
- Admin charts and statistics
- Role-based page protection (URL guarding)
- Multi-step checkout
- Payment gateway integration

### ⚠️ Known Issues/limitations
- Development server may require `--webpack` flag in some environments
- Full PostgreSQL setup requires manual database creation
- Payment processing is placeholder (no real gateway integrated)
- Email verification not implemented
- Social login (Google) not configured

## Development Notes

### Converting from TypeScript to JavaScript
This project was originally created with TypeScript but has been converted to JavaScript as per requirements. Key changes:
- TypeScript config files removed (`tsconfig.json`, `next-env.d.ts`)
- `next.config.ts` converted to `next.config.js`
- `.tsx` files converted to `.js`
- Type imports replaced with regular imports
- Prisma client uses JavaScript imports

### Database Migration
The project uses SQLite for development and PostgreSQL for production. The Prisma schema is compatible with both databases.

### Adding New Features
1. Add API route in `src/pages/api/`
2. Create page in `src/app/` (if frontend needed)
3. Add service logic in `src/services/`
4. Create UI components in `src/components/`
5. Update Prisma schema if database changes needed
6. Run `npx prisma generate` to regenerate client
7. Run `npx prisma migrate dev` for schema changes

## License

This project is for demonstration purposes. See the LICENSE file for more details.