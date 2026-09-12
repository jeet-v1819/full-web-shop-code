import prisma from "../../lib/prisma.js";

export default async function handler(req, res) {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: "asc" },
    });

    res.status(200).json(brands);
  } catch (error) {
    console.error("Error fetching brands:", error);
    res.status(500).json({ error: "Failed to fetch brands" });
  }
}