import { PrismaClient } from "@prisma/client";

export function createDBClient(): PrismaClient {
  return new PrismaClient();
}
