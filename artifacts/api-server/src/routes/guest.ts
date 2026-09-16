import { Router, type IRouter } from "express";
import { and, asc, eq, inArray, ne, sql } from "drizzle-orm";
import {
  GetMyParticipationResponse,
  ReleaseMyGiftResponse,
  UpsertMyParticipationBody,
  UpsertMyParticipationResponse,
} from "@workspace/api-zod";
import {
  db,
  giftsTable,
  participationGiftsTable,
  participationsTable,
} from "@workspace/db";
import {
  EVENT_ID,
  getClerkUser,
  getMyParticipation,
  getUserId,
  requireGuest,
} from "../lib/event";

const router: IRouter = Router();

class GiftCapacityError extends Error {}

router.get("/me/participation", requireGuest, async (req, res): Promise<void> => {
  const participation = await getMyParticipation(getUserId(req)!);
  if (!participation) {
    res.status(404).json({ error: "Ainda não há confirmação para este convidado." });
    return;
  }
  res.json(GetMyParticipationResponse.parse(participation));
});

router.put("/me/participation", requireGuest, async (req, res): Promise<void> => {
  const parsed = UpsertMyParticipationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = await getClerkUser(req);
  if (!user) {
    res.status(401).json({ error: "Faça login para continuar." });
    return;
  }
  const primaryEmail = user.emailAddresses.find(
    (entry) => entry.id === user.primaryEmailAddressId,
  )?.emailAddress;
  const guestName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    primaryEmail?.split("@")[0] ||
    "Convidado";
  const userId = getUserId(req)!;

  const giftIds = parsed.data.attending ? [...new Set(parsed.data.giftIds)] : [];
  if (parsed.data.attending && (giftIds.length < 1 || giftIds.length > 2)) {
    res.status(400).json({ error: "Escolha entre 1 e 2 presentes." });
    return;
  }

  try {
    await db.transaction(async (tx) => {
      const current = await tx
        .select({ id: participationsTable.id })
        .from(participationsTable)
        .where(eq(participationsTable.userId, userId));

      const values = {
        userId,
        guestName,
        guestEmail: primaryEmail ?? "",
        attending: parsed.data.attending,
        plusOne: parsed.data.plusOne,
        note: parsed.data.note,
        giftId: null,
        updatedAt: new Date(),
      };

      let participationId: number;
      if (current[0]) {
        const [updated] = await tx
          .update(participationsTable)
          .set(values)
          .where(eq(participationsTable.id, current[0].id))
          .returning({ id: participationsTable.id });
        participationId = updated.id;
      } else {
        const [inserted] = await tx
          .insert(participationsTable)
          .values(values)
          .returning({ id: participationsTable.id });
        participationId = inserted.id;
      }

      if (giftIds.length > 0) {
        const gifts = await tx
          .select({ id: giftsTable.id, quantity: giftsTable.quantity })
          .from(giftsTable)
          .where(
            and(
              inArray(giftsTable.id, giftIds),
              eq(giftsTable.eventId, EVENT_ID),
            ),
          )
          .orderBy(asc(giftsTable.id))
          .for("update");
        if (gifts.length !== giftIds.length) {
          throw new GiftCapacityError("Presente inválido para este evento.");
        }

        const reservations = await tx
          .select({
            giftId: participationGiftsTable.giftId,
            count: sql<number>`count(*)`,
          })
          .from(participationGiftsTable)
          .where(
            and(
              inArray(participationGiftsTable.giftId, giftIds),
              ne(participationGiftsTable.participationId, participationId),
            ),
          )
          .groupBy(participationGiftsTable.giftId);
        const reservedByGift = new Map(
          reservations.map((row) => [row.giftId, Number(row.count)]),
        );
        const unavailable = gifts.find(
          (gift) => (reservedByGift.get(gift.id) ?? 0) >= gift.quantity,
        );
        if (unavailable) {
          throw new GiftCapacityError(
            "Um dos presentes acabou de esgotar. Escolha outro item.",
          );
        }
      }

      await tx
        .delete(participationGiftsTable)
        .where(eq(participationGiftsTable.participationId, participationId));
      if (giftIds.length > 0) {
        await tx.insert(participationGiftsTable).values(
          giftIds.map((giftId) => ({ participationId, giftId })),
        );
      }
    });
  } catch (error) {
    if (error instanceof GiftCapacityError) {
      res.status(409).json({ error: error.message });
      return;
    }
    throw error;
  }

  const participation = await getMyParticipation(userId);
  res.json(UpsertMyParticipationResponse.parse(participation));
});

router.delete("/me/participation/gift", requireGuest, async (req, res): Promise<void> => {
  const userId = getUserId(req)!;
  const [participationRow] = await db
    .select({ id: participationsTable.id })
    .from(participationsTable)
    .where(eq(participationsTable.userId, userId));
  if (participationRow) {
    await db
      .delete(participationGiftsTable)
      .where(eq(participationGiftsTable.participationId, participationRow.id));
    await db
      .update(participationsTable)
      .set({ giftId: null, updatedAt: new Date() })
      .where(eq(participationsTable.id, participationRow.id));
  }
  const updatedParticipation = await getMyParticipation(userId);
  if (!updatedParticipation) {
    res.status(404).json({ error: "Ainda não há confirmação para este convidado." });
    return;
  }
  res.json(ReleaseMyGiftResponse.parse(updatedParticipation));
});

export default router;