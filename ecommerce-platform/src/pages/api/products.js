import prisma from "../../lib/prisma.js";

// Get products with filtering, searching, sorting, and pagination
export default async function handler(req, res) {
  try {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      minRating,
      availability,
      sortBy,
      page = 1,
      limit = 12,
    } = req.query;

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
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    // Filter by minimum rating
    if (minRating) {
      where.averageRating = { gte: Number(minRating) };
    }

    // Filter by availability
    if (availability === "in-stock") {
      where.stock = { gt: 0 };
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
          },
        },
      },
      orderBy: {
        [sortBy || "createdAt"]: "desc",
      },
      skip,
      take: Number(limit),
    });

    // Get total count
    const total = await prisma.product.count({ where });

    res.status(200).json({ products, total });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
}