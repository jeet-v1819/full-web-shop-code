import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  try {
    const { sellerId, search, category, status, page = 1, limit = 12, id } = req.query;

    if (!sellerId) {
      return res.status(400).json({ error: "sellerId is required" });
    }

    const where = { sellerId };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    if (category) {
      where.categoryId = category;
    }

    if (status) {
      where.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    if (req.method === "GET") {
      if (id) {
        const product = await prisma.product.findFirst({
          where: { id, sellerId },
          include: {
            category: true,
            brand: true,
          },
        });

        if (!product) {
          return res.status(404).json({ error: "Product not found" });
        }

        return res.status(200).json(product);
      }

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

      return res.status(200).json({
        products,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit),
      });
    }

    if (req.method === "POST") {
      const productData = req.body;
      let discountPrice = productData.price;
      if (productData.discount && Number(productData.discount) > 0) {
        discountPrice = Number(productData.price) * (1 - Number(productData.discount) / 100);
      }

      const product = await prisma.product.create({
        data: {
          name: productData.name,
          slug: (productData.name || "product").toLowerCase().replace(/\s+/g, "-"),
          description: productData.description,
          price: Number(productData.price),
          discount: productData.discount ? Number(productData.discount) : 0,
          discountPrice: Number(discountPrice.toFixed(2)),
          sku: productData.sku,
          stock: Number(productData.stock || 0),
          sellerId,
          categoryId: productData.categoryId,
          brandId: productData.brandId,
          images: productData.images ? JSON.stringify(productData.images) : "[]",
        },
      });

      return res.status(201).json(product);
    }

    if (req.method === "PUT") {
      const { id: productId, ...productData } = req.body;

      // Verify product belongs to seller
      const existing = await prisma.product.findFirst({
        where: { id: productId, sellerId },
      });

      if (!existing) {
        return res.status(404).json({ error: "Product not found or access denied" });
      }

      let discountPrice = productData.price;
      if (productData.discount && Number(productData.discount) > 0) {
        discountPrice = Number(productData.price) * (1 - Number(productData.discount) / 100);
      }

      const updateData = {
        name: productData.name,
        description: productData.description,
        price: Number(productData.price),
        discount: productData.discount ? Number(productData.discount) : 0,
        discountPrice: Number(discountPrice.toFixed(2)),
        sku: productData.sku,
        stock: Number(productData.stock || 0),
      };

      if (productData.categoryId) updateData.categoryId = productData.categoryId;
      if (productData.brandId) updateData.brandId = productData.brandId;
      if (productData.images !== undefined) updateData.images = JSON.stringify(productData.images);

      const product = await prisma.product.update({
        where: { id: productId },
        data: updateData,
      });

      return res.status(200).json(product);
    }

    if (req.method === "DELETE") {
      const { id: productId } = req.query || req.body;

      const existing = await prisma.product.findFirst({
        where: { id: productId, sellerId },
      });

      if (!existing) {
        return res.status(404).json({ error: "Product not found or access denied" });
      }

      await prisma.product.delete({ where: { id: productId } });
      return res.status(200).json({ message: "Product deleted" });
    }

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (error) {
    console.error("Seller products error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
