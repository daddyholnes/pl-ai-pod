import { drizzle } from "drizzle-orm/neon-http";
import { Pool } from "pg";
import { neon, neonConfig } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

// Setup neon config
neonConfig.fetchConnectionCache = true;

// Create a connection to the Neon database
const connectionString = process.env.DATABASE_URL!;
const sql = neon(connectionString);

// Export the PostgreSQL pool for session store
export const pool = new Pool({
  connectionString,
});

// Initialize drizzle with the schema
export const db = drizzle(sql, { schema });

// Export the schema for use in other files
export { schema };