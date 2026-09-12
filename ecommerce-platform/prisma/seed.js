const { PrismaClient } = require("/home/user/ecommerce-platform/src/generated/prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed data creation...");

  // Create Categories
  const categories = await Promise.all([
    prisma.category.create({ data: { name: "Electronics", slug: "electronics" } }),
    prisma.category.create({ data: { name: "Clothing", slug: "clothing" } }),
    prisma.category.create({ data: { name: "Books", slug: "books" } }),
    prisma.category.create({ data: { name: "Home & Garden", slug: "home-garden" } }),
    prisma.category.create({ data: { name: "Sports", slug: "sports" } }),
  ]);
  console.log("Categories created:", categories.length);

  // Create Brands
  const brands = await Promise.all([
    prisma.brand.create({ data: { name: "Apple", slug: "apple" } }),
    prisma.brand.create({ data: { name: "Samsung", slug: "samsung" } }),
    prisma.brand.create({ data: { name: "Nike", slug: "nike" } }),
    prisma.brand.create({ data: { name: "Adidas", slug: "adidas" } }),
    prisma.brand.create({ data: { name: "Penguin", slug: "penguin" } }),
    prisma.brand.create({ data: { name: "HarperCollins", slug: "harpercollins" } }),
  ]);
  console.log("Brands created:", brands.length);

  // Create Users
  const saltRounds = 10;
  const adminPassword = await bcrypt.hash("Password123!", saltRounds);
  const sellerPassword = await bcrypt.hash("Password123!", saltRounds);
  const customerPassword = await bcrypt.hash("Password123!", saltRounds);

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@shop.test",
      password: adminPassword,
      role: "ADMIN",
      name: "Admin User",
    },
  });

  const sellerUser = await prisma.user.create({
    data: {
      email: "seller@shop.test",
      password: sellerPassword,
      role: "SELLER",
      name: "Seller One",
    },
  });

  const sellerUser2 = await prisma.user.create({
    data: {
      email: "seller2@shop.test",
      password: sellerPassword,
      role: "SELLER",
      name: "Seller Two",
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      email: "customer@shop.test",
      password: customerPassword,
      role: "CUSTOMER",
      name: "Customer One",
    },
  });
  console.log("Users created");

  // Create Products for Seller 1
  const sellerProducts = await Promise.all([
    // Electronics
    prisma.product.create({
      data: {
        name: "iPhone 15 Pro",
        slug: "iphone-15-pro",
        description: "The latest iPhone with titanium design and A17 Pro chip.",
        price: 999.99,
        discount: 0,
        sku: "IPHONE15PRO-001",
        stock: 50,
        category: categories[0].id, // Electronics
        brand: brands[0].id, // Apple
        seller: sellerUser,
        sellerId: sellerUser.id,
        images: ["https://example.com/iphone15pro-1.jpg", "https://example.com/iphone15pro-2.jpg"],
      },
    }),
    prisma.product.create({
      data: {
        name: "Samsung Galaxy S24",
        slug: "samsung-galaxy-s24",
        description: "Flagship Android smartphone with pro-grade camera.",
        price: 799.99,
        discount: 0,
        sku: "SGS24-001",
        stock: 75,
        category: categories[0].id, // Electronics
        brand: brands[1].id, // Samsung
        seller: sellerUser,
        sellerId: sellerUser.id,
        images: ["https://example.com/galaxy-s24-1.jpg", "https://example.com/galaxy-s24-2.jpg"],
      },
    }),
    // Clothing
    prisma.product.create({
      data: {
        name: "Nike Running Shoes",
        slug: "nike-running-shoes",
        description: "High-performance running shoes for marathon training.",
        price: 129.99,
        discount: 0,
        sku: "NRS-001",
        stock: 100,
        category: categories[1].id, // Clothing
        brand: brands[2].id, // Nike
        seller: sellerUser,
        sellerId: sellerUser.id,
        size: ["S", "M", "L", "XL"],
        color: ["Black", "Red", "Blue"],
        images: ["https://example.com/nike-shoes-1.jpg", "https://example.com/nike-shoes-2.jpg"],
      },
    }),
    prisma.product.create({
      data: {
        name: "Adidas T-Shirt",
        slug: "adidas-t-shirt",
        description: "Comfortable cotton Adidas t-shirt.",
        price: 29.99,
        discount: 0,
        sku: "ATS-001",
        stock: 200,
        category: categories[1].id, // Clothing
        brand: brands[3].id, // Adidas
        seller: sellerUser,
        sellerId: sellerUser.id,
        size: ["S", "M", "L", "XL"],
        color: ["White", "Black", "Grey"],
        images: ["https://example.com/adidas-tshirt-1.jpg", "https://example.com/adidas-tshirt-2.jpg"],
      },
    }),
    // Books
    prisma.product.create({
      data: {
        name: "The Great Gatsby",
        slug: "the-great-gatsby",
        description: "F. Scott Fitzgerald's classic novel.",
        price: 14.99,
        discount: 0,
        sku: "TGG-001",
        stock: 300,
        category: categories[2].id, // Books
        brand: brands[5].id, // HarperCollins
        seller: sellerUser2,
        sellerId: sellerUser2.id,
        images: ["https://example.com/great-gatsby-1.jpg", "https://example.com/great-gatsby-2.jpg"],
      },
    }),
    prisma.product.create({
      data: {
        name: "Atomic Habits",
        slug: "atomic-habits",
        description: "James Clear's guide to building good habits.",
        price: 19.99,
        discount: 0,
        sku: "AH-001",
        stock: 250,
        category: categories[2].id, // Books
        brand: brands[5].id, // HarperCollins
        seller: sellerUser2,
        sellerId: sellerUser2.id,
        images: ["https://example.com/atomic-habits-1.jpg", "https://example.com/atomic-habits-2.jpg"],
      },
    }),
    // Home & Garden
    prisma.product.create({
      data: {
        name: "Smart Garden Kit",
        slug: "smart-garden-kit",
        description: "Automated indoor garden with LED lighting and watering system.",
        price: 149.99,
        discount: 0,
        sku: "SGK-001",
        stock: 25,
        category: categories[3].id, // Home & Garden
        brand: brands[0].id, // Apple
        seller: sellerUser,
        sellerId: sellerUser.id,
        images: ["https://example.com/smart-garden-1.jpg", "https://example.com/smart-garden-2.jpg"],
      },
    }),
  ]);
  console.log("Products created:", sellerProducts.length);

  // Create a review for The Great Gatsby
  await prisma.review.create({
    data: {
      rating: 5,
      comment: "A timeless classic! Beautiful prose and story.",
      user: customerUser,
      userId: customerUser.id,
      product: sellerProducts.find(p => p.slug === "the-great-gatsby"),
      productId: sellerProducts.find(p => p.slug === "the-great-gatsby").id,
    },
  });
  console.log("Review created");

  // Create cart for customer
  await prisma.cart.create({
    data: {
      user: customerUser,
      userId: customerUser.id,
    },
  });
  console.log("Cart created");

  // Create wishlist for customer
  await prisma.wishlist.create({
    data: {
      user: customerUser,
      userId: customerUser.id,
    },
  });
  console.log("Wishlist created");

  console.log("Seed data creation completed!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Error seeding data:", e);
    await prisma.$disconnect();
    process.exit(1);
  });