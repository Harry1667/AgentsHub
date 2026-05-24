import { mysqlTable, varchar, text, float, int, json, timestamp, mysqlEnum } from "drizzle-orm/mysql-core"

export const users = mysqlTable("users", {
  id:           varchar("id", { length: 64 }).primaryKey(),
  username:     varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 200 }).notNull(),
  role:         mysqlEnum("role", ["admin", "user"]).notNull().default("user"),
  createdAt:    timestamp("created_at").defaultNow(),
})

export const agents = mysqlTable("agents", {
  id:           varchar("id", { length: 64 }).primaryKey(),
  userId:       varchar("user_id", { length: 64 }),
  name:         varchar("name", { length: 128 }).notNull(),
  avatar:       varchar("avatar", { length: 8 }).notNull().default("🤖"),
  description:  text("description"),
  systemPrompt: text("system_prompt"),
  model:        varchar("model", { length: 128 }).notNull().default("claude-sonnet-4-6"),
  temperature:  float("temperature").notNull().default(0.7),
  maxTokens:    int("max_tokens").notNull().default(2048),
  tags:         json("tags").$type<string[]>().default([]),
  useCount:     int("use_count").notNull().default(0),
  isDefault:    int("is_default").notNull().default(0),
  createdAt:    timestamp("created_at").defaultNow(),
})

export const conversations = mysqlTable("conversations", {
  id:        varchar("id", { length: 64 }).primaryKey(),
  userId:    varchar("user_id", { length: 64 }),
  agentId:   varchar("agent_id", { length: 64 }).notNull(),
  title:     varchar("title", { length: 256 }).notNull().default("新對話"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
})

export const messages = mysqlTable("messages", {
  id:             varchar("id", { length: 64 }).primaryKey(),
  conversationId: varchar("conversation_id", { length: 64 }).notNull(),
  role:           mysqlEnum("role", ["user", "assistant"]).notNull(),
  content:        text("content").notNull(),
  createdAt:      timestamp("created_at").defaultNow(),
})
