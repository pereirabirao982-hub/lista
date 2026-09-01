import { pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const giftsTable = pgTable(
  "gifts",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id").notNull(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    categoryLabel: text("category_label").notNull(),
  },
  (table) => ({
    eventNameIndex: uniqueIndex("gifts_event_name_idx").on(
      table.eventId,
      table.name,
    ),
  }),
);

export const insertGiftSchema = createInsertSchema(giftsTable);
export type InsertGift = z.infer<typeof insertGiftSchema>;
export type Gift = typeof giftsTable.$inferSelect;