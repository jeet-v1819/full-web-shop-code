import prisma from "../../lib/prisma.js";

export default async function handler(req, res) {
  const { userId } = req.query;

  try {
    if (req.method === "GET") {
      // Get cart for user
      const cart = await prisma.cart.findFirst({
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

      if (!cart) {
        return res.status(200).json({ items: [] });
      }

      res.status(200).json({ items: cart.items });
    } else if (req.method === "POST") {
      // Add product to cart
      const { productId, quantity } = req.body;

      // Get or create cart
      let cart = await prisma.cart.findFirst({
        where: { userId },
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: {
            user: { connect: { id: userId } },
            items: [],
          },
        });
      }

      // Check product stock
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      if (product.stock < quantity) {
        return res.status(400).json({ error: "Insufficient stock available" });
      }

      // Check if product already in cart
      const existingItem = cart.items.find((item) => item.productId === productId);

      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity;

        if (product.stock < newQuantity) {
          return res.status(400).json({ error: "Insufficient stock for updated quantity" });
        }

        const updatedItem = await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
        });

        const updatedCart = await prisma.cart.findFirst({
          where: { userId },
          include: { items: true },
        });

        return res.status(200).json({ items: updatedCart.items });
      }

      // Add new item to cart
      const newItem = await prisma.cartItem.create({
        data: {
          cart: { connect: { id: cart.id } },
          product: { connect: { id: productId } },
          quantity,
        },
      });

      const updatedCart = await prisma.cart.findFirst({
        where: { userId },
        include: { items: true },
      });

      res.status(200).json({ items: updatedCart.items });
    } else if (req.method === "DELETE") {
      // Remove product from cart
      const { productId } = req.query;

      const cart = await prisma.cart.findFirst({
        where: { userId },
      });

      if (!cart) {
        return res.status(200).json({ items: [] });
      }

      const item = cart.items.find((item) => item.productId === productId);

      if (!item) {
        return res.status(200).json({ items: cart.items });
      }

      await prisma.cartItem.delete({
        where: { id: item.id },
      });

      const updatedCart = await prisma.cart.findFirst({
        where: { userId },
        include: { items: true },
      });

      res.status(200).json({ items: updatedCart.items });
    } else if (req.method === "PUT") {
      // Update cart item quantity
      const { productId, quantity } = req.body;

      const cart = await prisma.cart.findFirst({
        where: { userId },
      });

      if (!cart) {
        return res.status(404).json({ error: "Cart not found" });
      }

      const item = cart.items.find((item) => item.productId === productId);

      if (!item) {
        return res.status(404).json({ error: "Item not found in cart" });
      }

      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (product && product.stock < quantity) {
        return res.status(400).json({ error: "Insufficient stock available" });
      }

      const updatedItem = await prisma.cartItem.update({
        where: { id: item.id },
        data: { quantity },
      });

      const updatedCart = await prisma.cart.findFirst({
        where: { userId },
        include: { items: true },
      });

      res.status(200).json({ items: updatedCart.items });
    } else {
      res.setHeader("Allow", ["GET", "POST", "DELETE", "PUT"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("Cart API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}