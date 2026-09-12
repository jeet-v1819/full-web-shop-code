import prisma from "../lib/prisma.js";
import { addToCart } from "./cartService.js";

// Get wishlist for a user
export async function getWishlist(userId) {
  return await prisma.wishlist.findFirst({
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

// Get or create wishlist for a user
export async function getOrCreateWishlist(userId) {
  let wishlist = await prisma.wishlist.findFirst({
    where: { userId },
  });

  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: {
        user: { connect: { id: userId } },
      },
    });
  }

  // Include items with product details
  return await prisma.wishlist.findFirst({
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

// Add product to wishlist
export async function addToWishlist(userId, productId) {
  const wishlist = await getOrCreateWishlist(userId);

  // Check if product already in wishlist
  const existingItem = wishlist.items.find((item) => item.productId === productId);

  if (existingItem) {
    return existingItem; // Already in wishlist
  }

  return await prisma.wishlistItem.create({
    data: {
      wishlist: { connect: { id: wishlist.id } },
      product: { connect: { id: productId } },
    },
  });
}

// Remove product from wishlist
export async function removeFromWishlist(userId, productId) {
  const wishlist = await getWishlist(userId);
  if (!wishlist) return null;

  return await prisma.wishlistItem.delete({
    where: { id: productId, wishlistId: wishlist.id },
  });
}

// Move product from wishlist to cart
export async function moveToCart(userId, productId) {
  // Remove from wishlist
  await removeFromWishlist(userId, productId);

  // Add to cart
  return await addToCart(userId, productId);
}

// Clear wishlist
export async function clearWishlist(userId) {
  const wishlist = await getWishlist(userId);
  if (!wishlist) return null;

  const itemIds = wishlist.items.map((item) => item.id);

  if (itemIds.length > 0) {
    await prisma.wishlistItem.deleteMany({
      where: { id: { in: itemIds } },
    });
  }

  return { message: "Wishlist cleared successfully" };
}