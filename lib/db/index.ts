import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

// Create database connection only if DATABASE_URL is available
// This prevents build-time errors when the env var isn't set
let db: ReturnType<typeof drizzle<typeof schema>>;

if (connectionString) {
  // Disable prefetch as it is not supported for "Transaction" pool mode
  const client = postgres(connectionString, { prepare: false });
  db = drizzle(client, { schema });
} else {
  // Create a placeholder that will throw meaningful errors at runtime
  db = new Proxy({} as any, {
    get(_, prop) {
      throw new Error(
        `Database not configured. Please set DATABASE_URL environment variable. Attempted to access: ${String(prop)}`
      );
    },
  });
}

export { db };

export * from "./schema";
