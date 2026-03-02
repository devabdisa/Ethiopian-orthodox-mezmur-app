import { Pool } from "pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const connectionString = process.env.DATABASE_URL;

// Ensure pool is also global so we don't leak connections on Next.js HMR
const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString,
    max: 10, // max 10 concurrent connections
    idleTimeoutMillis: 20_000, // close idle connections after 20s
    connectionTimeoutMillis: 10_000, // fail fast instead of hanging 73s
    keepAlive: true, // TCP keepalive to prevent Neon from dropping idle connections
    keepAliveInitialDelayMillis: 10_000,
  });
if (process.env.NODE_ENV !== "production") globalForPrisma.pool = pool;

const adapter = new PrismaPg(pool);

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
export default prisma;
