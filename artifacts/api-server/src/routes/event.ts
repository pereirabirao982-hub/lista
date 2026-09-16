import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  GetEventResponse,
  ListGiftsResponse,
} from "@workspace/api-zod";
import { db, eventsTable, giftsTable } from "@workspace/db";
import {
  EVENT_ID,
  buildGiftResponse,
  getMyParticipation,
  getGiftReservationCounts,
  getUserId,
} from "../lib/event";

const router: IRouter = Router();

router.get("/event", async (req, res): Promise<void> => {
  const [event] = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.id, EVENT_ID));
  if (!event) {
    res.status(404).json({ error: "Evento não encontrado." });
    return;
  }
  res.json(GetEventResponse.parse(event));
});

router.get("/gifts", async (req, res): Promise<void> => {
  const [gifts, reservationCounts, participation] = await Promise.all([
    db.select().from(giftsTable).where(eq(giftsTable.eventId, EVENT_ID)),
    getGiftReservationCounts(),
    getUserId(req) ? getMyParticipation(getUserId(req)!) : Promise.resolve(null),
  ]);
  const response = gifts.map((gift) =>
    buildGiftResponse(
      gift,
      reservationCounts,
      new Set(participation?.giftIds ?? []),
    ),
  );
  res.json(ListGiftsResponse.parse(response));
});

export default router;