import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  try {
    const { sellerId, status, page = 1, limit = 10, id } = req.query;

    if (!sellerId) {
      return res.status(400).json({ error: "sellerId is required" });
    }

    const where = { sellerId };
    if (status) {
      where.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    if (req.method === "GET") {
      if (id) {
        const order = await prisma.order.findFirst({
          where: { id, sellerId },
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

        if (!order) {
          return res.status(404).json({ error: "Order not found" });
        }

        return res.status(200).json(order);
      }

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

      return res.status(200).json({
        orders,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit),
      });
    }

    if (req.method === "PUT") {
      const { id: orderId, status: newStatus } = req.body;
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });
      return res.status(200).json(order);
    }

    res.setHeader("Allow", ["GET", "PUT"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (error) {
    console.error("Seller orders error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
