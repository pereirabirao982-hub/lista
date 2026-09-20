import { asc, desc, eq, sql } from "drizzle-orm";
import { clerkClient, getAuth } from "@clerk/express";
import {
  db,
  eventsTable,
  giftsTable,
  participationGiftsTable,
  participationsTable,
} from "@workspace/db";
import type { Request, RequestHandler } from "express";

export const EVENT_ID = "evento-casa-nova";
export const ADMIN_EMAILS = (
  process.env.ADMIN_EMAIL || "admin@evento.local"
)
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
export const ADMIN_EMAIL = ADMIN_EMAILS[0] || "admin@evento.local";

export const giftSeed = [
  ["cozinha-acucareiro", "Açucareiro", "cozinha", "Cozinha", 2],
  ["cozinha-formas-assadeiras", "Formas e assadeiras", "cozinha", "Cozinha", 5],
  ["cozinha-jogo-panelas", "Jogo de panelas", "cozinha", "Cozinha", 1],
  ["cozinha-panela-pressao", "Panela de pressão", "cozinha", "Cozinha", 1],
  ["cozinha-descanso-panela", "Descanso de panela", "cozinha", "Cozinha", 5],
  ["cozinha-conjunto-xicaras", "Conjunto de xícaras", "cozinha", "Cozinha", 3],
  ["cozinha-potes-condimentos", "Porta condimentos", "cozinha", "Cozinha", 4],
  ["cozinha-leiteira", "Leiteira", "cozinha", "Cozinha", 1],
  ["cozinha-copo-medidas", "Copo de medidas", "cozinha", "Cozinha", 1],
  ["cozinha-pegador-macarrao", "Pegador de macarrão", "cozinha", "Cozinha", 3],
  ["cozinha-peneira", "Peneira", "cozinha", "Cozinha", 1],
  ["cozinha-coador-macarrao", "Coador de macarrão", "cozinha", "Cozinha", 1],
  ["cozinha-porta-papel", "Porta papel toalha", "cozinha", "Cozinha", 1],
  ["cozinha-panos-prato", "Panos de prato", "cozinha", "Cozinha", 10],
  ["cozinha-lixeira", "Lixeira de cozinha", "cozinha", "Cozinha", 2],
  ["cozinha-chaleira", "Chaleira", "cozinha", "Cozinha", 1],
  ["cozinha-colher-pau", "Colher de pau", "cozinha", "Cozinha", 3],
  ["cozinha-jogo-pratos", "Jogo de pratos", "cozinha", "Cozinha", 3],
  ["cozinha-talheres", "Talheres", "cozinha", "Cozinha", 3],
  ["cozinha-escorredor-louca", "Escorredor de louça", "cozinha", "Cozinha", 1],
  ["cozinha-escorredor-macarrao", "Escorredor de macarrão", "cozinha", "Cozinha", 2],
  ["cozinha-jogo-talheres", "Escorredor de talheres", "cozinha", "Cozinha", 2],
  ["cozinha-espumadeira", "Escumadeira", "cozinha", "Cozinha", 2],
  ["cozinha-frigideira", "Frigideira", "cozinha", "Cozinha", 2],
  ["cozinha-tabua-cortes", "Tábua para cortes", "cozinha", "Cozinha", 2],
  ["cozinha-potes-multiuso", "Potes multiuso", "cozinha", "Cozinha", 6],
  ["cozinha-jarra", "Jarra para suco/água", "cozinha", "Cozinha", 2],
  ["cozinha-garrafa-termica", "Garrafa térmica", "cozinha", "Cozinha", 1],
  ["cozinha-porta-detergente", "Porta detergente e esponja", "cozinha", "Cozinha", 2],
  ["cozinha-conjunto-sobremesa", "Conjunto para sobremesa", "cozinha", "Cozinha", 3],
  ["cozinha-toalha-mesa", "Toalha de mesa", "cozinha", "Cozinha", 4],
  ["cozinha-rodinho-pia", "Rodinho de pia", "cozinha", "Cozinha", 2],
  ["cozinha-ralador", "Ralador", "cozinha", "Cozinha", 2],
  ["cozinha-saleiro", "Saleiro", "cozinha", "Cozinha", 2],
  ["cozinha-jogo-americano", "Jogo americano", "cozinha", "Cozinha", 3],
  ["cozinha-jogo-copos", "Jogo de copos", "cozinha", "Cozinha", 3],
  ["cozinha-jogo-facas", "Jogo de facas", "cozinha", "Cozinha", 2],
  ["cozinha-triturador", "Triturador", "cozinha", "Cozinha", 2],
  ["cozinha-potes-plasticos", "Potes plásticos", "cozinha", "Cozinha", 10],
  ["cozinha-pipoqueira", "Pipoqueira", "cozinha", "Cozinha", 1],
  ["servico-baldes", "Baldes de plástico", "servico", "Área de serviço", 3],
  ["servico-mop", "Mop", "servico", "Área de serviço", 1],
  ["servico-tapetes", "Tapetes", "servico", "Área de serviço", 3],
  ["eletros-chaleira-eletrica", "Chaleira elétrica", "eletros", "Eletros", 1],
  ["eletros-batedeira", "Batedeira", "eletros", "Eletros", 1],
  ["eletros-cafeteira", "Cafeteira", "eletros", "Eletros", 1],
  ["banheiro-porta-escova", "Porta escova de dentes", "banheiro", "Banheiro", 1],
  ["banheiro-tapete", "Tapete antiderrapante", "banheiro", "Banheiro", 2],
  ["banheiro-toalha-maos", "Toalha de mãos", "banheiro", "Banheiro", 1],
  ["banheiro-toalha-banho", "Toalhas de banho", "banheiro", "Banheiro", 3],
  ["banheiro-toalhas-rosto", "Toalhas de rosto", "banheiro", "Banheiro", 3],
  ["banheiro-cesto-roupa", "Cesto de roupa", "banheiro", "Banheiro", 1],
  ["banheiro-lixeira", "Lixeira", "banheiro", "Banheiro", 1],
  ["banheiro-saboneteira", "Saboneteira", "banheiro", "Banheiro", 2],
  ["decoracao-espelhos", "Espelhos", "decoracao", "Itens de decoração", 2],
  ["decoracao-almofadas", "Almofadas", "decoracao", "Itens de decoração", 2],
  ["decoracao-iluminacao", "Luminárias", "decoracao", "Itens de decoração", 1],
  ["decoracao-relogio", "Relógio de parede", "decoracao", "Itens de decoração", 1],
  ["decoracao-porta-chaves", "Porta-chaves", "decoracao", "Itens de decoração", 1],
  ["decoracao-porta-retrato", "Porta-retrato", "decoracao", "Itens de decoração", 5],
  ["decoracao-vaso", "Vasos decorativos", "decoracao", "Itens de decoração", 2],
  ["sala-cortina", "Cortina para sala", "sala", "Sala", 3],
  ["sala-mantas-almofadas", "Mantas e almofadas", "sala", "Sala", 5],
  ["sala-tapete", "Tapete", "sala", "Sala", 2],
  ["sala-quadros", "Quadros decorativos", "sala", "Sala", 3],
  ["sala-capa-sofa", "Capa para sofá", "sala", "Sala", 4],
  ["sala-toalha-mesa", "Toalha de mesa", "sala", "Sala", 5],
  ["quarto-coberta", "Coberta/edredom", "quarto", "Quarto de casal", 3],
  ["quarto-lencol", "Lençol", "quarto", "Quarto de casal", 5],
] as const;

export async function seedEvent(): Promise<void> {
  await db
    .insert(eventsTable)
    .values({
      id: EVENT_ID,
      title: "Lista de presentes",
      subtitle: "Sua presença é o nosso maior presente",
      dateLabel: "Sábado, 24 de outubro, às 18h",
      dateIso: new Date("2026-10-24T18:00:00-03:00").toISOString(),
      location: "Estalagem, Viamão - RS",
      address: "R. Eng. Ildo Meneghetti, 955 - Estalagem, Viamão - RS, 94425-010",
      hostName: "Anfitrião do evento",
      hostEmail: ADMIN_EMAIL,
      rsvpDeadline: "Confirme sua presença até 15 de outubro",
    })
    .onConflictDoUpdate({
      target: eventsTable.id,
      set: {
        dateLabel: "Sábado, 24 de outubro, às 18h",
        dateIso: new Date("2026-10-24T18:00:00-03:00").toISOString(),
        location: "Estalagem, Viamão - RS",
        address: "R. Eng. Ildo Meneghetti, 955 - Estalagem, Viamão - RS, 94425-010",
        rsvpDeadline: "Confirme sua presença até 15 de outubro",
      },
    });

  await db
    .insert(giftsTable)
    .values(
      giftSeed.map(([id, name, category, categoryLabel, quantity]) => ({
        id,
        eventId: EVENT_ID,
        name,
        category,
        categoryLabel,
        quantity,
      })),
    )
    .onConflictDoUpdate({
      target: giftsTable.id,
      set: {
        name: sql`excluded.name`,
        category: sql`excluded.category`,
        categoryLabel: sql`excluded.category_label`,
        quantity: sql`excluded.quantity`,
      },
    });

  await db.execute(sql`
    insert into participation_gifts (participation_id, gift_id)
    select id, gift_id
    from participations
    where gift_id is not null
    on conflict (participation_id, gift_id) do nothing
  `);
}

export function getUserId(req: Request): string | null {
  const auth = getAuth(req);
  return auth.userId || null;
}

export async function getClerkUser(req: Request) {
  const userId = getUserId(req);
  if (!userId) return null;
  return clerkClient.users.getUser(userId);
}

export const requireGuest: RequestHandler = (req, res, next) => {
  if (!getUserId(req)) {
    res.status(401).json({ error: "Faça login para continuar." });
    return;
  }
  next();
};

export async function isAdmin(req: Request): Promise<boolean> {
  const user = await getClerkUser(req);
  const email = user?.emailAddresses.find(
    (entry) => entry.id === user.primaryEmailAddressId,
  )?.emailAddress;
  return Boolean(email && ADMIN_EMAILS.includes(email.trim().toLowerCase()));
}

export const requireAdmin: RequestHandler = async (req, res, next) => {
  if (!getUserId(req)) {
    res.status(401).json({ error: "Faça login para continuar." });
    return;
  }
  if (!(await isAdmin(req))) {
    res.status(403).json({ error: "Acesso reservado ao anfitrião." });
    return;
  }
  next();
};

export function buildGiftResponse(
  gift: typeof giftsTable.$inferSelect,
  reservationCounts: Map<string, number>,
  myGiftIds: Set<string>,
) {
  const reservedQuantity = reservationCounts.get(gift.id) ?? 0;
  const availableQuantity = Math.max(gift.quantity - reservedQuantity, 0);
  const reservedByMe = myGiftIds.has(gift.id);
  return {
    id: gift.id,
    name: gift.name,
    category: gift.category,
    categoryLabel: gift.categoryLabel,
    quantity: gift.quantity,
    reservedQuantity,
    availableQuantity,
    available: availableQuantity > 0 || reservedByMe,
    reservedByMe,
  };
}

export async function getMyParticipation(userId: string) {
  const [row] = await db
    .select({
      id: participationsTable.id,
      userId: participationsTable.userId,
      guestName: participationsTable.guestName,
      guestEmail: participationsTable.guestEmail,
      attending: participationsTable.attending,
      plusOne: participationsTable.plusOne,
      note: participationsTable.note,
      updatedAt: participationsTable.updatedAt,
    })
    .from(participationsTable)
    .where(eq(participationsTable.userId, userId));
  if (!row) return null;
  const selections = await db
    .select({ id: giftsTable.id, name: giftsTable.name })
    .from(participationGiftsTable)
    .innerJoin(giftsTable, eq(participationGiftsTable.giftId, giftsTable.id))
    .where(eq(participationGiftsTable.participationId, row.id))
    .orderBy(asc(giftsTable.name));
  return {
    ...row,
    id: String(row.id),
    giftIds: selections.map((gift) => gift.id),
    giftNames: selections.map((gift) => gift.name),
  };
}

export async function getGiftReservationCounts() {
  const rows = await db
    .select({
      giftId: participationGiftsTable.giftId,
      count: sql<number>`count(*)`,
    })
    .from(participationGiftsTable)
    .groupBy(participationGiftsTable.giftId);
  return new Map(rows.map((row) => [row.giftId, Number(row.count)]));
}

export async function getAdminParticipationRows() {
  const rows = await db
    .select({
      id: participationsTable.id,
      guestName: participationsTable.guestName,
      guestEmail: participationsTable.guestEmail,
      attending: participationsTable.attending,
      plusOne: participationsTable.plusOne,
      note: participationsTable.note,
      updatedAt: participationsTable.updatedAt,
    })
    .from(participationsTable)
    .orderBy(desc(participationsTable.updatedAt), asc(participationsTable.guestName));
  const selections = await db
    .select({
      participationId: participationGiftsTable.participationId,
      giftName: giftsTable.name,
    })
    .from(participationGiftsTable)
    .innerJoin(giftsTable, eq(participationGiftsTable.giftId, giftsTable.id))
    .orderBy(asc(giftsTable.name));
  const giftsByParticipation = new Map<number, string[]>();
  for (const selection of selections) {
    const names = giftsByParticipation.get(selection.participationId) ?? [];
    names.push(selection.giftName);
    giftsByParticipation.set(selection.participationId, names);
  }
  return rows.map((row) => ({
    ...row,
    id: String(row.id),
    giftNames: giftsByParticipation.get(row.id) ?? [],
  }));
}

export async function getAdminSummary() {
  const [guests] = await db
    .select({
      totalGuests: sql<number>`count(*)`,
      attendingCount: sql<number>`count(*) filter (where ${participationsTable.attending} = true)`,
      declinedCount: sql<number>`count(*) filter (where ${participationsTable.attending} = false)`,
      plusOneCount: sql<number>`count(*) filter (where ${participationsTable.plusOne} = true)`,
      lastUpdatedAt: sql<Date | null>`max(${participationsTable.updatedAt})`,
    })
    .from(participationsTable);
  const [giftCounts] = await db
    .select({
      totalGifts: sql<number>`coalesce(sum(${giftsTable.quantity}), 0)`,
    })
    .from(giftsTable);
  const [reservationCounts] = await db
    .select({
      reservedGifts: sql<number>`count(*)`,
    })
    .from(participationGiftsTable);
  const totalGifts = Number(giftCounts?.totalGifts ?? 0);
  const reservedGifts = Number(reservationCounts?.reservedGifts ?? 0);
  return {
    totalGuests: Number(guests?.totalGuests ?? 0),
    attendingCount: Number(guests?.attendingCount ?? 0),
    declinedCount: Number(guests?.declinedCount ?? 0),
    pendingCount: 0,
    plusOneCount: Number(guests?.plusOneCount ?? 0),
    totalGifts,
    reservedGifts,
    availableGifts: totalGifts - reservedGifts,
    lastUpdatedAt: guests?.lastUpdatedAt ?? null,
  };
}