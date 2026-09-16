import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { giftsTable } from "./gifts";
import { participationsTable } from "./participations";

export const participationGiftsTable = pgTable(
  "participation_gifts",
  {
    id: serial("id").primaryKey(),
    participationId: integer("participation_id")
      .notNull()
      .references(() => participationsTable.id, { onDelete: "cascade" }),
    giftId: text("gift_id")
      .notNull()
      .references(() => giftsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    participationGiftIndex: uniqueIndex(
      "participation_gifts_participation_gift_idx",
    ).on(table.participationId, table.giftId),
    giftIndex: index("participation_gifts_gift_idx").on(table.giftId),
  }),
);

export const insertParticipationGiftSchema = createInsertSchema(
  participationGiftsTable,
);
export type InsertParticipationGift = z.infer<
  typeof insertParticipationGiftSchema
>;
export type ParticipationGift =
  typeof participationGiftsTable.$inferSelect;