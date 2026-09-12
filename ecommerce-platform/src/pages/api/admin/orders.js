import prisma from "../../lib/prisma.js";

// Get all orders with pagination and filtering
export async function getAllOrders(filters = {}) {
  const { search, status, seller, customer, page = 1, limit = 10 } = filters;

  const where = {};

  // Filter by search (order number or customer email)
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  // Filter by status
  if (status) {
    where.status = status;
  }

  // Filter by seller
  if (seller) {
    where.sellerId = seller;
  }

  // Filter by customer
  if (customer) {
    where.userId = customer;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        seller: {
          select: { id: true, name: true },
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
export async function getOrderDetail(orderId) {
  return await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true, address: true },
      },
      seller: {
        select: { id: true, name: true },
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

// Update order status (admin)
export async function updateOrderStatusAdmin(orderId, status) {
  return await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
}

// Delete order (admin)
export async function deleteOrder(orderId) {
  return await prisma.order.delete({
    where: { id: orderId },
  });
}
