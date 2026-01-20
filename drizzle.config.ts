import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // @ts-expect-error - url is valid for postgresql dialect
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
