

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import dotenv from "dotenv";

dotenv.config();

console.log("Database connection configured");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(isProduction
    ? {
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {}),
});

export const db = drizzle(pool, { schema });
