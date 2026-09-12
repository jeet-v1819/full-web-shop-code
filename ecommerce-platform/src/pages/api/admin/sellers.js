import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;

    const where = { role: "SELLER" };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (status) {
      where.status = status === "active";
    }

    const skip = (Number(page) - 1) * Number(limit);

    if (req.method === "GET") {
      if (req.query.id) {
        const seller = await prisma.user.findUnique({
          where: { id: req.query.id },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
          },
        });

        if (!seller) {
          return res.status(404).json({ error: "Seller not found" });
        }

        // Get stats
        const [totalProducts, totalOrders, pendingOrders, completedOrders, totalSales] = await Promise.all([
          prisma.product.count({ where: { sellerId: seller.id } }),
          prisma.order.count({ where: { sellerId: seller.id } }),
          prisma.order.count({ where: { sellerId: seller.id, status: "PENDING" } }),
          prisma.order.count({ where: { sellerId: seller.id, status: "DELIVERED" } }),
          prisma.order.aggregate({
            where: { sellerId: seller.id },
            _sum: { total: true },
          }),
        ]);

        return res.status(200).json({
          ...seller,
          stats: {
            totalProducts,
            totalOrders,
            pendingOrders,
            completedOrders,
            totalSales: totalSales._sum.total || 0,
          },
        });
      }

      const [sellers, total] = await Promise.all([
        prisma.user.findMany({
          where,
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
        prisma.user.count({ where }),
      ]);

      return res.status(200).json({
        sellers,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit),
      });
    }

    if (req.method === "PUT") {
      const { id, status: newStatus } = req.body;
      const seller = await prisma.user.update({
        where: { id },
        data: { status: newStatus },
      });
      return res.status(200).json(seller);
    }

    if (req.method === "DELETE") {
      const { id } = req.query || req.body;
      await prisma.user.delete({ where: { id } });
      return res.status(200).json({ message: "Seller deleted" });
    }

    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (error) {
    console.error("Admin sellers error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
