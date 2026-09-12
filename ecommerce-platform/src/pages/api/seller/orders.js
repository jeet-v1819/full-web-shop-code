import prisma from "../../lib/prisma.js";

// Get all orders for a seller
export async function getSellerOrders(sellerId, filters = {}) {
  const { status, page = 1, limit = 10 } = filters;

  const where = { sellerId };

  // Filter by status
  if (status) {
    where.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { orderDate: "desc" },
      skip,
      take: Number(limit),
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
}

// Get a single order by ID
export async function getSellerOrderById(orderId, sellerId) {
  return await prisma.order.findFirst({
    where: { id: orderId, sellerId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      items: {
        include: {
          product: {
            include: {
              category: true,
              brand: true,
            },
          },
        },
      },
    },
  });
}

// Update order status
export async function updateSellerOrderStatus(orderId, sellerId, status) {
  // Check if order belongs to this seller
  const order = await prisma.order.findFirst({
    where: { id: orderId, sellerId },
  });

  if (!order) {
    throw new Error("Order not found or access denied");
  }

  return await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
}