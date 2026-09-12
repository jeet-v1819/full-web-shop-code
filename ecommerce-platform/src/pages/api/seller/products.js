import prisma from "../../lib/prisma.js";

// Get all products for a seller
export async function getSellerProducts(sellerId, filters = {}) {
  const { search, category, status, page = 1, limit = 12 } = filters;

  const where = { sellerId };

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
export async function getSellerProductById(productId, sellerId) {
  return await prisma.product.findFirst({
    where: { id: productId, sellerId },
  });
}

// Create a new product
export async function createSellerProduct(productData, sellerId) {
  const { name, description, price, discount, sku, categoryId, brandId, stock, images } = productData;

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
      seller: { connect: { id: sellerId } },
      images: images || [],
    },
  });

  return product;
}

// Update a product
export async function updateSellerProduct(productId, sellerId, productData) {
  // Check if product belongs to this seller
  const product = await prisma.product.findFirst({
    where: { id: productId, sellerId },
  });

  if (!product) {
    throw new Error("Product not found or access denied");
  }

  const { name, description, price, discount, sku, categoryId, brandId, stock, images } = productData;

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
    ...(images !== undefined && { images }),
  };

  return await prisma.product.update({
    where: { id: productId },
    data: updateData,
  });
}

// Delete a product
export async function deleteSellerProduct(productId, sellerId) {
  // Check if product belongs to this seller
  const product = await prisma.product.findFirst({
    where: { id: productId, sellerId },
  });

  if (!product) {
    throw new Error("Product not found or access denied");
  }

  return await prisma.product.delete({
    where: { id: productId },
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