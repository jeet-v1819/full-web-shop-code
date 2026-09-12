import prisma from "../../lib/prisma.js";

// Get all products with pagination and filtering
export async function getAllProducts(filters = {}) {
  const { search, category, brand, status, page = 1, limit = 12 } = filters;

  const where = {};

  // Filter by search
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
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

  // Filter by status
  if (status) {
    where.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        brand: true,
        seller: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(limit),
    }),
    prisma.product.count({ where }),
  ]);

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
            select: { id: true, name: true },
          },
        },
      },
      _count: {
        select: { reviews: true, cartItems: true, wishlistItems: true },
      },
    },
  });
}

// Create a new product (admin)
export async function createAdminProduct(productData) {
  const { name, description, price, discount, sku, categoryId, brandId, stock, sellerId, images } = productData;

  // Calculate discount price
  let discountPrice = price;
  if (discount && Number(discount) > 0) {
    discountPrice = Number(price) * (1 - Number(discount) / 100);
  }

  const product = await prisma.product.create({
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
      ...(sellerId && { seller: { connect: { id: sellerId } } }),
      images: images || [],
    },
  });

  return product;
}

// Update a product (admin)
export async function updateAdminProduct(productId, productData) {
  const { name, description, price, discount, sku, categoryId, brandId, stock, sellerId, images } = productData;

  // Calculate discount price
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
    ...(sellerId && { seller: { connect: { id: sellerId } } }),
    ...(images !== undefined && { images }),
  };

  return await prisma.product.update({
    where: { id: productId },
    data: updateData,
  });
}

// Delete a product (admin)
export async function deleteAdminProduct(productId) {
  return await prisma.product.delete({
    where: { id: productId },
  });
}

// Update product stock (admin)
export async function updateProductStock(productId, newStock) {
  return await prisma.product.update({
    where: { id: productId },
    data: { stock: Number(newStock) },
  });
}

// Toggle product status (enable/disable)
export async function toggleProductStatus(productId, status) {
  return await prisma.product.update({
    where: { id: productId },
    data: { status },
  });
}