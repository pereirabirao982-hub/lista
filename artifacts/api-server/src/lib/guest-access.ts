import { createHash } from "node:crypto";
import type { Request } from "express";

const TOKEN_PREFIX = "guest:";
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,60}$/;

export function guestIdentityFromToken(token: string): string | null {
  if (!TOKEN_PATTERN.test(token)) return null;
  return `${TOKEN_PREFIX}${createHash("sha256").update(token).digest("hex")}`;
}

export function getGuestIdentity(req: Request): string | null {
  const match = req.header("authorization")?.match(/^Bearer ([A-Za-z0-9_-]{40,60})$/);
  return match ? guestIdentityFromToken(match[1]) : null;
}