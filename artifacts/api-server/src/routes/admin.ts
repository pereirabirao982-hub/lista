import { Router, type IRouter } from "express";
import {
  GetAdminSummaryResponse,
  ListAdminParticipationsResponse,
} from "@workspace/api-zod";
import { getAdminParticipationRows, getAdminSummary, requireAdmin } from "../lib/event";

const router: IRouter = Router();

router.get("/admin/summary", requireAdmin, async (_req, res): Promise<void> => {
  res.json(GetAdminSummaryResponse.parse(await getAdminSummary()));
});

router.get("/admin/participations", requireAdmin, async (_req, res): Promise<void> => {
  res.json(ListAdminParticipationsResponse.parse(await getAdminParticipationRows()));
});

export default router;