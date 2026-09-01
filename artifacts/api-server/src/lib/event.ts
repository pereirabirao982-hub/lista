import { and, asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { clerkClient, getAuth } from "@clerk/express";
import { db, eventsTable, giftsTable, participationsTable } from "@workspace/db";
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
  ["cozinha-acucareiro", "Açucareiro", "cozinha", "Cozinha"],
  ["cozinha-formas-assadeiras", "Formas e assadeiras", "cozinha", "Cozinha"],
  ["cozinha-jogo-panelas", "Jogo de panelas", "cozinha", "Cozinha"],
  ["cozinha-conjunto-xicaras", "Conjunto de xícaras", "cozinha", "Cozinha"],
  ["cozinha-potes-condimentos", "Potes para condimentos", "cozinha", "Cozinha"],
  ["cozinha-espumadeira", "Espumadeira", "cozinha", "Cozinha"],
  ["cozinha-leiteira", "Leiteira", "cozinha", "Cozinha"],
  ["cozinha-copo-medidas", "Copo de medidas", "cozinha", "Cozinha"],
  ["cozinha-peneira", "Peneira", "cozinha", "Cozinha"],
  ["cozinha-coador-macarrao", "Coador de macarrão", "cozinha", "Cozinha"],
  ["cozinha-porta-papel", "Porta papel de alumínio", "cozinha", "Cozinha"],
  ["cozinha-panela-pressao", "Panela de pressão", "cozinha", "Cozinha"],
  ["cozinha-lixeira", "Lixeira de cozinha", "cozinha", "Cozinha"],
  ["cozinha-chaleira", "Chaleira", "cozinha", "Cozinha"],
  ["cozinha-colher-pau", "Colher de pau", "cozinha", "Cozinha"],
  ["cozinha-jogo-pratos", "Jogo de pratos", "cozinha", "Cozinha"],
  ["cozinha-talheres", "Talheres", "cozinha", "Cozinha"],
  ["cozinha-escorredor-louca", "Escorredor de louça", "cozinha", "Cozinha"],
  ["cozinha-escorredor-macarrao", "Escorredor de macarrão", "cozinha", "Cozinha"],
  ["cozinha-jogo-talheres", "Jogo de talheres", "cozinha", "Cozinha"],
  ["cozinha-frigideira", "Frigideira", "cozinha", "Cozinha"],
  ["cozinha-tabua-cortes", "Tábua para cortes", "cozinha", "Cozinha"],
  ["cozinha-potes-multiuso", "Potes multiuso", "cozinha", "Cozinha"],
  ["cozinha-jarra", "Jarra para suco/água", "cozinha", "Cozinha"],
  ["cozinha-garrafa-termica", "Garrafa térmica", "cozinha", "Cozinha"],
  ["cozinha-porta-detergente", "Porta detergente e esponja", "cozinha", "Cozinha"],
  ["cozinha-conjunto-sobremesa", "Conjunto para sobremesa", "cozinha", "Cozinha"],
  ["cozinha-toalha-mesa", "Toalha de mesa", "cozinha", "Cozinha"],
  ["cozinha-ralador", "Ralador", "cozinha", "Cozinha"],
  ["cozinha-saleiro", "Saleiro", "cozinha", "Cozinha"],
  ["cozinha-jogo-americano", "Jogo americano", "cozinha", "Cozinha"],
  ["servico-baldes", "Baldes de plástico", "servico", "Área de serviço"],
  ["servico-mop", "Mop", "servico", "Área de serviço"],
  ["servico-tapetes", "Tapetes", "servico", "Área de serviço"],
  ["eletros-chaleira-eletrica", "Chaleira elétrica", "eletros", "Eletros"],
  ["eletros-batedeira", "Batedeira", "eletros", "Eletros"],
  ["eletros-cafeteira", "Cafeteira", "eletros", "Eletros"],
  ["banheiro-porta-escova", "Porta escova de dentes", "banheiro", "Banheiro"],
  ["banheiro-tapete", "Tapete antiderrapante", "banheiro", "Banheiro"],
  ["banheiro-toalha-maos", "Toalha de mãos", "banheiro", "Banheiro"],
  ["banheiro-toalha-banho", "Toalha de banho", "banheiro", "Banheiro"],
  ["banheiro-toalhas-rosto", "Toalhas de rosto", "banheiro", "Banheiro"],
  ["banheiro-cesto-roupa", "Cesto de roupa", "banheiro", "Banheiro"],
  ["banheiro-lixeira", "Lixeira", "banheiro", "Banheiro"],
  ["banheiro-saboneteira", "Saboneteira", "banheiro", "Banheiro"],
  ["decoracao-espelhos", "Espelhos", "decoracao", "Itens de decoração"],
  ["decoracao-almofadas", "Almofadas", "decoracao", "Itens de decoração"],
  ["decoracao-iluminacao", "Iluminação", "decoracao", "Itens de decoração"],
  ["decoracao-relogio", "Relógio de parede", "decoracao", "Itens de decoração"],
  ["decoracao-porta-chaves", "Porta-chaves", "decoracao", "Itens de decoração"],
  ["decoracao-porta-retrato", "Porta-retrato", "decoracao", "Itens de decoração"],
  ["decoracao-vaso", "Vaso decorativo", "decoracao", "Itens de decoração"],
  ["sala-cortina", "Cortina para sala", "sala", "Sala"],
  ["sala-mantas-almofadas", "Mantas e almofadas", "sala", "Sala"],
  ["sala-tapete", "Tapete", "sala", "Sala"],
  ["sala-quadros", "Quadros decorativos", "sala", "Sala"],
  ["sala-capa-sofa", "Capa para sofá", "sala", "Sala"],
  ["quarto-coberta", "Coberta/edredom", "quarto", "Quarto de casal"],
  ["quarto-lencol", "Lençol", "quarto", "Quarto de casal"],
] as const;

export async function seedEvent(): Promise<void> {
  const [existingEvent] = await db
    .select({ id: eventsTable.id })
    .from(eventsTable)
    .where(eq(eventsTable.id, EVENT_ID));

  if (!existingEvent) {
    await db.insert(eventsTable).values({
      id: EVENT_ID,
      title: "Lista de presentes",
      subtitle: "Sua presença é o nosso maior presente",
      dateLabel: "Uma nova fase começa em breve",
      dateIso: new Date("2026-12-19T18:00:00-03:00").toISOString(),
      location: "A confirmar com os convidados",
      address: "Detalhes do endereço serão compartilhados em breve",
      hostName: "Anfitrião do evento",
      hostEmail: ADMIN_EMAIL,
      rsvpDeadline: "Confirme sua presença até 10 de dezembro",
    });
  }

  const existingGifts = await db
    .select({ id: giftsTable.id })
    .from(giftsTable)
    .where(eq(giftsTable.eventId, EVENT_ID));
  if (existingGifts.length === 0) {
    await db.insert(giftsTable).values(
      giftSeed.map(([id, name, category, categoryLabel]) => ({
        id,
        eventId: EVENT_ID,
        name,
        category,
        categoryLabel,
      })),
    );
  }
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
  reservedGiftIds: Set<string>,
  myGiftId: string | null,
) {
  const reserved = reservedGiftIds.has(gift.id);
  return {
    id: gift.id,
    name: gift.name,
    category: gift.category,
    categoryLabel: gift.categoryLabel,
    available: !reserved || gift.id === myGiftId,
    reservedByMe: gift.id === myGiftId,
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
      giftId: participationsTable.giftId,
      giftName: giftsTable.name,
      updatedAt: participationsTable.updatedAt,
    })
    .from(participationsTable)
    .leftJoin(giftsTable, eq(participationsTable.giftId, giftsTable.id))
    .where(eq(participationsTable.userId, userId));
  return row ?? null;
}

export async function getReservedGiftIds() {
  const rows = await db
    .select({ giftId: participationsTable.giftId })
    .from(participationsTable)
    .where(isNotNull(participationsTable.giftId));
  return new Set(rows.map((row) => row.giftId).filter((id): id is string => !!id));
}

export async function getAdminParticipationRows() {
  return db
    .select({
      id: participationsTable.id,
      guestName: participationsTable.guestName,
      guestEmail: participationsTable.guestEmail,
      attending: participationsTable.attending,
      plusOne: participationsTable.plusOne,
      note: participationsTable.note,
      giftName: giftsTable.name,
      updatedAt: participationsTable.updatedAt,
    })
    .from(participationsTable)
    .leftJoin(giftsTable, eq(participationsTable.giftId, giftsTable.id))
    .orderBy(desc(participationsTable.updatedAt), asc(participationsTable.guestName));
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
      totalGifts: sql<number>`count(*)`,
      reservedGifts: sql<number>`count(*) filter (where ${participationsTable.giftId} is not null)`,
    })
    .from(giftsTable)
    .leftJoin(participationsTable, eq(giftsTable.id, participationsTable.giftId));
  return {
    totalGuests: Number(guests?.totalGuests ?? 0),
    attendingCount: Number(guests?.attendingCount ?? 0),
    declinedCount: Number(guests?.declinedCount ?? 0),
    pendingCount: 0,
    plusOneCount: Number(guests?.plusOneCount ?? 0),
    totalGifts: Number(giftCounts?.totalGifts ?? 0),
    reservedGifts: Number(giftCounts?.reservedGifts ?? 0),
    availableGifts:
      Number(giftCounts?.totalGifts ?? 0) - Number(giftCounts?.reservedGifts ?? 0),
    lastUpdatedAt: guests?.lastUpdatedAt ?? null,
  };
}