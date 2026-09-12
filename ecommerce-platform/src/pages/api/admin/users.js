import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  try {
    const { search, role, status, page = 1, limit = 10 } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status !== undefined) {
      where.status = status === "active" || status === "true";
    }

    const skip = (Number(page) - 1) * Number(limit);

    if (req.method === "GET") {
      if (req.query.id) {
        const user = await prisma.user.findUnique({
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

        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json(user);
      }

      const [users, total] = await Promise.all([
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
        users,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit),
      });
    }

    if (req.method === "PUT") {
      const { id, role: newRole, status: newStatus } = req.body;
      const updateData = {};
      if (newRole) updateData.role = newRole;
      if (newStatus !== undefined) updateData.status = newStatus;

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
      });

      return res.status(200).json(user);
    }

    if (req.method === "DELETE") {
      const { id } = req.query || req.body;
      await prisma.user.delete({ where: { id } });
      return res.status(200).json({ message: "User deleted" });
    }

    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (error) {
    console.error("Admin users error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
