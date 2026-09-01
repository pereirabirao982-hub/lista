import { Router, type IRouter } from "express";
import { and, eq, ne } from "drizzle-orm";
import {
  GetMyParticipationResponse,
  ReleaseMyGiftResponse,
  UpsertMyParticipationBody,
  UpsertMyParticipationResponse,
} from "@workspace/api-zod";
import { db, giftsTable, participationsTable } from "@workspace/db";
import {
  EVENT_ID,
  getClerkUser,
  getMyParticipation,
  getUserId,
  requireGuest,
} from "../lib/event";

const router: IRouter = Router();

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

  if (parsed.data.giftId) {
    const [gift] = await db
      .select({ id: giftsTable.id })
      .from(giftsTable)
      .where(and(eq(giftsTable.id, parsed.data.giftId), eq(giftsTable.eventId, EVENT_ID)));
    if (!gift) {
      res.status(400).json({ error: "Presente inválido para este evento." });
      return;
    }
  }

  try {
    await db.transaction(async (tx) => {
      const current = await tx
        .select({ id: participationsTable.id, giftId: participationsTable.giftId })
        .from(participationsTable)
        .where(eq(participationsTable.userId, userId));

      const values = {
        userId,
        guestName,
        guestEmail: primaryEmail ?? "",
        attending: parsed.data.attending,
        plusOne: parsed.data.plusOne,
        note: parsed.data.note,
        giftId: parsed.data.giftId,
        updatedAt: new Date(),
      };

      if (current[0]) {
        await tx
          .update(participationsTable)
          .set(values)
          .where(eq(participationsTable.id, current[0].id));
      } else {
        await tx.insert(participationsTable).values(values);
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("participations_gift_id_idx")) {
      res.status(409).json({ error: "Esse presente acabou de ser escolhido por outra pessoa." });
      return;
    }
    throw error;
  }

  const participation = await getMyParticipation(userId);
  res.json(UpsertMyParticipationResponse.parse(participation));
});

router.delete("/me/participation/gift", requireGuest, async (req, res): Promise<void> => {
  const userId = getUserId(req)!;
  await db
    .update(participationsTable)
    .set({ giftId: null, updatedAt: new Date() })
    .where(eq(participationsTable.userId, userId));
  const participation = await getMyParticipation(userId);
  if (!participation) {
    res.status(404).json({ error: "Ainda não há confirmação para este convidado." });
    return;
  }
  res.json(ReleaseMyGiftResponse.parse(participation));
});

export default router;