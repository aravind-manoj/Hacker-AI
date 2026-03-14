import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL as string;

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update. In production, we create a new connection for every instance.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

export const client = globalForDb.conn ?? postgres(connectionString, { prepare: false });
if (process.env.NODE_ENV !== "production") globalForDb.conn = client;

export const db = drizzle(client);

