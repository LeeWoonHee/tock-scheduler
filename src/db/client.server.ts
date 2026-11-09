import { Pool, neonConfig } from '@neondatabase/serverless'
import { drizzle, type NeonDatabase } from 'drizzle-orm/neon-serverless'
import ws from 'ws'
import * as schema from './schema'

neonConfig.webSocketConstructor = ws
export type Database = NeonDatabase<typeof schema>
export async function withDatabase<T>(run: (db: Database) => Promise<T>) {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    connectionTimeoutMillis: 10000,
  })
  try {
    return await run(drizzle(pool, { schema }))
  } finally {
    await pool.end()
  }
}
