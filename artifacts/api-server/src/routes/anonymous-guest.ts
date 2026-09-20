import { randomBytes } from "node:crypto";
import { Router } from "express";
import { and, asc, eq, inArray, ne, sql } from "drizzle-orm";
import {
  db,
  giftsTable,
  participationGiftsTable,
  participationsTable,
} from "@workspace/db";
import {
  CreateGuestParticipationBody,
  CreateGuestParticipationResponse,
  GetGuestParticipationResponse,
  ReleaseGuestGiftResponse,
  UpdateGuestParticipationBody,
  UpdateGuestParticipationResponse,
} from "@workspace/api-zod";
import { EVENT_ID, getMyParticipation } from "../lib/event";
import { getGuestIdentity, guestIdentityFromToken } from "../lib/guest-access";

const router = Router();

class GiftCapacityError extends Error {}
class GuestAccessError extends Error {}

type GuestInput = {
  guestName: string;
  attending: boolean;
  plusOne: boolean;
  note: string | null;
  giftIds: string[];
};

async function saveParticipation(
  userId: string,
  input: GuestInput,
  create: boolean,
) {
  const giftIds = input.attending ? [...new Set(input.giftIds)] : [];
  if (input.attending && (giftIds.length < 1 || giftIds.length > 2)) {
    throw new GiftCapacityError("Escolha entre 1 e 2 presentes.");
  }

  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);
    const [current] = await tx
      .select({ id: participationsTable.id })
      .from(participationsTable)
      .where(eq(participationsTable.userId, userId))
      .for("update");

    if (create && current) throw new Error("Guest identity collision.");
    if (!create && !current) throw new GuestAccessError();

    const values = {
      userId,
      guestName: input.guestName.trim(),
      guestEmail: "",
      attending: input.attending,
      plusOne: input.attending ? input.plusOne : false,
      note: input.note?.trim() || null,
      giftId: null,
      updatedAt: new Date(),
    };

    let participationId: number;
    if (current) {
      await tx
        .update(participationsTable)
        .set(values)
        .where(eq(participationsTable.id, current.id));
      participationId = current.id;
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
        .where(and(inArray(giftsTable.id, giftIds), eq(giftsTable.eventId, EVENT_ID)))
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
      const reserved = new Map(
        reservations.map((row) => [row.giftId, Number(row.count)]),
      );
      if (gifts.some((gift) => (reserved.get(gift.id) ?? 0) >= gift.quantity)) {
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

  const participation = await getMyParticipation(userId);
  if (!participation) throw new Error("Guest participation was not saved.");
  return participation;
}

router.post("/guest/participation", async (req, res): Promise<void> => {
  const parsed = CreateGuestParticipationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const accessToken = randomBytes(32).toString("base64url");
  const userId = guestIdentityFromToken(accessToken)!;
  try {
    const participation = await saveParticipation(userId, parsed.data, true);
    res
      .status(201)
      .json(CreateGuestParticipationResponse.parse({ accessToken, participation }));
  } catch (error) {
    if (error instanceof GiftCapacityError) {
      res.status(409).json({ error: error.message });
      return;
    }
    throw error;
  }
});

router.get("/guest/participation", async (req, res): Promise<void> => {
  const userId = getGuestIdentity(req);
  if (!userId) {
    res.status(401).json({ error: "Acesso deste aparelho não encontrado." });
    return;
  }
  const participation = await getMyParticipation(userId);
  if (!participation) {
    res.status(401).json({ error: "Acesso deste aparelho não encontrado." });
    return;
  }
  res.json(GetGuestParticipationResponse.parse(participation));
});

router.put("/guest/participation", async (req, res): Promise<void> => {
  const userId = getGuestIdentity(req);
  const parsed = UpdateGuestParticipationBody.safeParse(req.body);
  if (!userId) {
    res.status(401).json({ error: "Acesso deste aparelho não encontrado." });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    res.json(UpdateGuestParticipationResponse.parse(
      await saveParticipation(userId, parsed.data, false),
    ));
  } catch (error) {
    if (error instanceof GiftCapacityError) {
      res.status(409).json({ error: error.message });
      return;
    }
    if (error instanceof GuestAccessError) {
      res.status(401).json({ error: "Acesso deste aparelho não encontrado." });
      return;
    }
    throw error;
  }
});

router.delete("/guest/participation/gift", async (req, res): Promise<void> => {
  const userId = getGuestIdentity(req);
  if (!userId) {
    res.status(401).json({ error: "Acesso deste aparelho não encontrado." });
    return;
  }
  const participationId = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);
    const [participation] = await tx
      .select({ id: participationsTable.id })
      .from(participationsTable)
      .where(eq(participationsTable.userId, userId))
      .for("update");
    if (!participation) return null;
    await tx
      .delete(participationGiftsTable)
      .where(eq(participationGiftsTable.participationId, participation.id));
    await tx
      .update(participationsTable)
      .set({ updatedAt: new Date() })
      .where(eq(participationsTable.id, participation.id));
    return participation.id;
  });
  if (!participationId) {
    res.status(401).json({ error: "Acesso deste aparelho não encontrado." });
    return;
  }
  const updated = await getMyParticipation(userId);
  res.json(ReleaseGuestGiftResponse.parse(updated));
});

export default router;