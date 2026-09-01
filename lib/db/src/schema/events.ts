import { pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eventsTable = pgTable("events", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  dateLabel: text("date_label").notNull(),
  dateIso: text("date_iso").notNull(),
  location: text("location").notNull(),
  address: text("address").notNull(),
  hostName: text("host_name").notNull(),
  hostEmail: text("host_email").notNull(),
  rsvpDeadline: text("rsvp_deadline").notNull(),
});

export const insertEventSchema = createInsertSchema(eventsTable);
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof eventsTable.$inferSelect;