/**
 * PrismaClient wrapper for the application.
 * Uses better-sqlite3 under the hood with a Prisma-compatible API.
 */
import { PrismaClient as PrismaClientImpl } from "./db.js";

const globalForPrisma = globalThis;

const prisma = globalForPrisma.__prisma ?? new PrismaClientImpl();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}

export default prisma;
export { PrismaClientImpl as PrismaClient };
