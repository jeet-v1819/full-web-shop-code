import prisma from "../lib/prisma.js";

// Get all products with filtering, searching, and pagination
export async function getProducts(filters = {}, options = {}) {
  const {
    search,
    category,
    brand,
    minPrice,
    maxPrice,
    minRating,
    availability,
    size,
    color,
    page = 1,
    limit = 12,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = filters;

  const where = {};

  // Search by name, SKU, or brand
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { brand: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  // Filter by category
  if (category) {
    where.categoryId = category;
  }

  // Filter by brand
  if (brand) {
    where.brandId = brand;
  }

  // Filter by price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  // Filter by minimum rating
  if (minRating !== undefined) {
    where.averageRating = { gte: Number(minRating) };
  }

  // Filter by availability
  if (availability === "in-stock") {
    where.stock = { gt: 0 };
  }

  // Filter by size and color - only for clothing category
  if (size || color) {
    // We'll filter after getting results since size/color are product variants
    // For now, we'll include them in the where clause if needed
    if (size) {
      // This is a simplified approach - size is not a separate field in the schema
      // We'll handle this in the frontend filter logic
    }
    if (color) {
      // Same as above - color is not a separate field
    }
  }

  // Calculate skip
  const skip = (Number(page) - 1) * Number(limit);

  // Get products
  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      brand: true,
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip,
    take: Number(limit),
  });

  // Get total count for pagination
  const total = await prisma.product.count({ where });

  return {
    products,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
}

// Get a single product by ID
export async function getProductById(productId) {
  return await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
      brand: true,
      seller: true,
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          reviews: true,
          cartItems: true,
          wishlistItems: true,
        },
      },
    },
  });
}

// Create a new product (seller only)
export async function createProduct(productData) {
  const { name, description, price, discount, sku, categoryId, brandId, stock, sellerId, images, size, color } = productData;

  // Calculate discount price if discount is provided
  let discountPrice = price;
  if (discount && Number(discount) > 0) {
    discountPrice = Number(price) * (1 - Number(discount) / 100);
  }

  return await prisma.product.create({
    data: {
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-") || "product",
      description,
      price: Number(price),
      discount: discount ? Number(discount) : 0,
      discountPrice: Number(discountPrice.toFixed(2)),
      sku,
      stock: Number(stock || 0),
      category: { connect: { id: categoryId } },
      brand: { connect: { id: brandId } },
      seller: { connect: { id: sellerId } },
      images: images || [],
      // Store size and color as JSON for clothing products
      ...(size || color && { specifications: { size, color } }),
    },
  });
}

// Update a product (seller only)
export async function updateProduct(productId, productData) {
  const { name, description, price, discount, sku, categoryId, brandId, stock, images, size, color } = productData;

  // Calculate discount price if discount is provided
  let discountPrice = price;
  if (discount && Number(discount) > 0) {
    discountPrice = Number(price) * (1 - Number(discount) / 100);
  }

  const updateData = {
    name,
    description,
    price: Number(price),
    discount: discount ? Number(discount) : 0,
    discountPrice: Number(discountPrice.toFixed(2)),
    sku,
    stock: Number(stock || 0),
    ...(categoryId && { category: { connect: { id: categoryId } } }),
    ...(brandId && { brand: { connect: { id: brandId } } }),
    ...(images && { images }),
    ...(size || color && { specifications: { size, color } }),
  };

  return await prisma.product.update({
    where: { id: productId },
    data: updateData,
  });
}

// Delete a product (seller/admin only)
export async function deleteProduct(productId) {
  return await prisma.product.delete({
    where: { id: productId },
  });
}

// Update product stock
export async function updateProductStock(productId, newStock) {
  return await prisma.product.update({
    where: { id: productId },
    data: { stock: Number(newStock) },
  });
}

// Get product categories
export async function getCategories() {
  return await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
}

// Get product brands
export async function getBrands() {
  return await prisma.brand.findMany({
    orderBy: { name: "asc" },
  });
}

// Get product by SKU
export async function getProductBySku(sku) {
  return await prisma.product.findUnique({
    where: { sku },
  });
}

// Increment product view count (for tracking popularity)
export async function incrementProductView(productId) {
  return await prisma.product.update({
    where: { id: productId },
    data: { _increment: { views: 1 } },
  });
}

// Get featured/newest products
export async function getFeaturedProducts(limit = 8) {
  return await prisma.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      category: { select: { name: true } },
      brand: { select: { name: true } },
      seller: {
        select: { id: true, name: true },
      },
    },
  });
}