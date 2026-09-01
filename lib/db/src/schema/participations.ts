import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const participationsTable = pgTable(
  "participations",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    guestName: text("guest_name").notNull(),
    guestEmail: text("guest_email").notNull(),
    attending: boolean("attending").notNull().default(false),
    plusOne: boolean("plus_one").notNull().default(false),
    note: text("note"),
    giftId: text("gift_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIndex: uniqueIndex("participations_user_id_idx").on(table.userId),
    giftIndex: uniqueIndex("participations_gift_id_idx").on(table.giftId),
  }),
);

export const insertParticipationSchema =
  createInsertSchema(participationsTable);
export type InsertParticipation = z.infer<typeof insertParticipationSchema>;
export type Participation = typeof participationsTable.$inferSelect;