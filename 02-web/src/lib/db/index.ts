import { drizzle } from "drizzle-orm/mysql2"
import mysql from "mysql2/promise"
import * as schema from "./schema"

declare global {
  // eslint-disable-next-line no-var
  var _mysqlPool: mysql.Pool | undefined
}

function getPool() {
  if (!global._mysqlPool) {
    global._mysqlPool = mysql.createPool({
      uri: process.env.DATABASE_URL!,
      waitForConnections: true,
      connectionLimit: 10,
    })
  }
  return global._mysqlPool
}

export function getDb() {
  return drizzle(getPool(), { schema, mode: "default" })
}
