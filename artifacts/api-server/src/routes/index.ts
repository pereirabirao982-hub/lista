import { Router, type IRouter } from "express";
import healthRouter from "./health";
import eventRouter from "./event";
import guestRouter from "./guest";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(eventRouter);
router.use(guestRouter);
router.use(adminRouter);

export default router;
