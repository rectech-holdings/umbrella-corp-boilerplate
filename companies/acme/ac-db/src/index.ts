import { PrismaClient } from "@prisma/client";

export * from "@prisma/client";

export function createDBClient() {
  return new PrismaClient();
}
