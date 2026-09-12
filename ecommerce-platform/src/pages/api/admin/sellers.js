import prisma from "../../lib/prisma.js";

// Get all sellers with pagination and filtering
export async function getAllSellers(filters = {}) {
  const { search, status, page = 1, limit = 10 } = filters;

  const where = {};

  // Filter by search
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  // Filter by status
  if (status) {
    where.status = status === "active";
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [sellers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      role: "SELLER",
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(limit),
    }),
    prisma.user.count({ where: { role: "SELLER", ...(status !== undefined ? { status: status === "active" } : {})} }),
  ]);

  return {
    sellers,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
}

// Get a single seller by ID
export async function getSellerById(userId) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });
}

// Enable or disable seller
export async function toggleSellerStatus(userId, status) {
  return await prisma.user.update({
    where: { id: userId },
    data: { status },
  });
}

// Get seller statistics
export async function getSellerStats(userId) {
  const [totalProducts, totalOrders, pendingOrders, completedOrders, totalSales] = await Promise.all([
    prisma.product.count({ where: { sellerId: userId } }),
    prisma.order.count({ where: { sellerId: userId } }),
    prisma.order.count({ where: { sellerId: userId, status: "PENDING" } }),
    prisma.order.count({ where: { sellerId: userId, status: "DELIVERED" } }),
    prisma.order.aggregate({
      where: { sellerId: userId },
      _sum: { total: true },
    }),
  ]);

  return {
    totalProducts,
    totalOrders,
    pendingOrders,
    completedOrders,
    totalSales: totalSales._sum.total || 0,
  };
}