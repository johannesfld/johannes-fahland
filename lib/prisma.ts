import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { resolve } from "path";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  let url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  // Convert relative path to absolute
  if (url.startsWith("file:./")) {
    const relativePath = url.replace("file:", "");
    const absolutePath = resolve(process.cwd(), relativePath);
    url = `file:${absolutePath}`;
  }

  const adapter = new PrismaBetterSqlite3({ url });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
