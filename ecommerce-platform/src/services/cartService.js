import prisma from "../lib/prisma.js";

// Get cart for a user
export async function getCart(userId) {
  return await prisma.cart.findFirst({
    where: { userId },
    include: {
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

// Get or create cart for a user
export async function getOrCreateCart(userId) {
  let cart = await prisma.cart.findFirst({
    where: { userId },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        user: { connect: { id: userId } },
      },
    });
  }

  // Include items with product details
  return await prisma.cart.findFirst({
    where: { userId },
    include: {
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

// Add product to cart
export async function addToCart(userId, productId, quantity = 1) {
  // Check if product exists and has enough stock
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  if (product.stock < quantity) {
    throw new Error("Insufficient stock available");
  }

  // Check if product already in cart
  const cart = await getOrCreateCart(userId);
  const existingItem = cart.items.find((item) => item.productId === productId);

  if (existingItem) {
    // Update quantity
    const newQuantity = existingItem.quantity + quantity;
    if (product.stock < newQuantity) {
      throw new Error("Insufficient stock available for updated quantity");
    }
    return await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQuantity },
    });
  }

  // Add new item to cart
  return await prisma.cartItem.create({
    data: {
      cart: { connect: { id: cart.id } },
      product: { connect: { id: productId } },
      quantity,
    },
  });
}

// Remove product from cart
export async function removeFromCart(userId, productId) {
  const cart = await getCart(userId);
  if (!cart) return null;

  return await prisma.cartItem.delete({
    where: { id: productId, cartId: cart.id },
  });
}

// Update cart item quantity
export async function updateCartQuantity(userId, productId, quantity) {
  const cart = await getCart(userId);
  if (!cart) throw new Error("Cart not found");

  const item = cart.items.find((item) => item.productId === productId);
  if (!item) throw new Error("Product not in cart");

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (product.stock < quantity) {
    throw new Error("Insufficient stock available");
  }

  return await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity },
  });
}

// Clear cart
export async function clearCart(userId) {
  const cart = await getCart(userId);
  if (!cart) return null;

  // Delete all items in the cart
  const itemIds = cart.items.map((item) => item.id);
  
  if (itemIds.length > 0) {
    await prisma.cartItem.deleteMany({
      where: { id: { in: itemIds } },
    });
  }

  return { message: "Cart cleared successfully" };
}

// Calculate cart subtotal
export async function calculateCartSubtotal(userId) {
  const cart = await getCart(userId);
  if (!cart || cart.items.length === 0) {
    return { subtotal: 0, items: [] };
  }

  let subtotal = 0;
  const itemsWithPrices = [];

  for (const item of cart.items) {
    const product = item.product;
    const price = product.discount > 0 && product.discountPrice ? product.discountPrice : product.price;
    const total = price * item.quantity;
    subtotal += total;

    itemsWithPrices.push({
      ...item,
      product,
      price,
      total,
    });
  }

  return { subtotal, items: itemsWithPrices };
}