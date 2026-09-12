import prisma from "../lib/prisma.js";

// Create a new order
export async function createOrder(userId, sellerId, items, shippingAddress) {
  // Get the user's cart to calculate totals
  const cart = await prisma.cart.findFirst({
    where: { userId },
    include: { items: { include: { product: true } } },
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  // Calculate order totals
  let subtotal = 0;
  const orderItems = [];

  for (const cartItem of cart.items) {
    const product = cartItem.product;

    // Check stock availability
    if (product.stock < cartItem.quantity) {
      throw new Error(`Insufficient stock for ${product.name}`);
    }

    const price = product.discount > 0 && product.discountPrice ? product.discountPrice : product.price;
    const total = price * cartItem.quantity;

    subtotal += total;

    orderItems.push({
      product: { connect: { id: product.id } },
      quantity: cartItem.quantity,
      price: Number(price.toFixed(2)),
      total: Number(total.toFixed(2)),
    });
  }

  // Calculate discount (e.g., 10% off)
  const discountPercent = 0; // Will be calculated based on cart rules
  const discountAmount = Number((subtotal * discountPercent / 100).toFixed(2));

  // Calculate shipping (flat rate for now)
  const shipping = 5.99;

  // Calculate tax (e.g., 10%)
  const tax = Number((subtotal * 0.1).toFixed(2));

  const total = Number((subtotal - discountAmount + shipping + tax).toFixed(2));

  // Create the order
  const order = await prisma.order.create({
    data: {
      orderNumber: `ORD-${Date.now()}`,
      user: { connect: { id: userId } },
      seller: { connect: { id: sellerId } },
      status: "PENDING",
      paymentStatus: "PENDING",
      subtotal: Number(subtotal.toFixed(2)),
      discount: discountAmount,
      shipping,
      tax,
      total,
      shippingAddress,
      items: {
        create: orderItems.map((item, index) => ({
          product: { connect: { id: item.productId } },
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
      },
    },
  });

  // Update product stock
  for (const cartItem of cart.items) {
    await prisma.product.update({
      where: { id: cartItem.productId },
      data: { stock: { decrement: cartItem.quantity } },
    });
  }

  // Clear the cart
  await prisma.cart.delete({
    where: { userId },
  });

  return order;
}

// Get order by ID
export async function getOrderById(orderId, userId) {
  return await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      seller: {
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

// Get orders for a user
export async function getOrdersByUser(userId, options = {}) {
  const { page = 1, limit = 10 } = options;

  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      include: {
        seller: {
          select: { id: true, name: true },
        },
      },
      orderBy: { orderDate: "desc" },
      skip,
      take: Number(limit),
    }),
    prisma.order.count({ where: { userId } }),
  ]);

  return {
    orders,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
}

// Get orders for a seller
export async function getOrdersBySeller(sellerId, options = {}) {
  const { page = 1, limit = 10, status } = options;

  const where = { sellerId };
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

// Update order status (seller/admin)
export async function updateOrderStatus(orderId, status, sellerId) {
  // First check if the order belongs to this seller
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

// Cancel order (customer)
export async function cancelOrder(orderId, userId) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
  });

  if (!order) {
    throw new Error("Order not found or access denied");
  }

  // Only allow cancellation in certain statuses
  if (order.status === "DELIVERED" || order.status === "SHIPPED") {
    throw new Error("Cannot cancel order that has been shipped or delivered");
  }

  return await prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
  });
}

// Add review to product
export async function addReview(userId, productId, rating, comment) {
  // Check if user already reviewed this product
  const existingReview = await prisma.review.findFirst({
    where: { userId, productId },
  });

  if (existingReview) {
    throw new Error("You have already reviewed this product");
  }

  // Create the review
  const review = await prisma.review.create({
    data: {
      rating: Number(rating),
      comment,
      user: { connect: { id: userId } },
      product: { connect: { id: productId } },
    },
  });

  // Update product average rating and review count
  const reviews = await prisma.review.findMany({
    where: { productId },
  });

  const averageRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
  const reviewCount = reviews.length;

  await prisma.product.update({
    where: { id: productId },
    data: {
      averageRating: parseFloat(averageRating.toFixed(1)),
      reviewCount,
    },
  });

  return review;
}

// Get product reviews
export async function getProductReviews(productId, options = {}) {
  const { page = 1, limit = 10 } = options;
  const skip = (Number(page) - 1) * Number(limit);

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: { id: true, name: true, email: false },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(limit),
    }),
    prisma.review.count({ where: { productId } }),
  ]);

  return {
    reviews,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
}