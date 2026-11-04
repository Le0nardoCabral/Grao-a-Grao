import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "./PrismaClient.js";

export class ComprasRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  transaction<T>(operation: (transaction: Prisma.TransactionClient) => Promise<T>) {
    return this.client.$transaction(operation, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5_000,
      timeout: 15_000,
    });
  }
}
