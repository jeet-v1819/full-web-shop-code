import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  try {
    const { search, status, seller, customer, page = 1, limit = 10 } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { user: { email: { contains: search } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (seller) {
      where.sellerId = seller;
    }

    if (customer) {
      where.userId = customer;
    }

    const skip = (Number(page) - 1) * Number(limit);

    if (req.method === "GET") {
      if (req.query.id) {
        // Get single order
        const order = await prisma.order.findUnique({
          where: { id: req.query.id },
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

        if (!order) {
          return res.status(404).json({ error: "Order not found" });
        }

        return res.status(200).json(order);
      }

      // Get all orders
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

      return res.status(200).json({
        orders,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit),
      });
    }

    if (req.method === "PUT") {
      const { id, status: newStatus } = req.body;
      const order = await prisma.order.update({
        where: { id },
        data: { status: newStatus },
      });
      return res.status(200).json(order);
    }

    if (req.method === "DELETE") {
      const { id } = req.query || req.body;
      await prisma.order.delete({ where: { id } });
      return res.status(200).json({ message: "Order deleted" });
    }

    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (error) {
    console.error("Admin orders error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
