import prisma from "../../lib/prisma.js";

// Get all users with pagination and filtering
export async function getAllUsers(filters = {}) {
  const { search, role, status, page = 1, limit = 10 } = filters;

  const where = {};

  // Filter by search
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  // Filter by role
  if (role) {
    where.role = role;
  }

  // Filter by status
  if (status) {
    where.status = status === "active";
  }

  const skip = (Number(page) - 1) * Number(limit);

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

  return {
    users,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
}

// Get a single user by ID
export async function getUserById(userId) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });
}

// Change user role
export async function changeUserRole(userId, newRole) {
  return await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });
}

// Toggle user status (enable/disable)
export async function toggleUserStatus(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return await prisma.user.update({
    where: { id: userId },
    data: { status: !user.status },
  });
}

// Delete a user
export async function deleteUser(userId) {
  return await prisma.user.delete({
    where: { id: userId },
  });
}