import { Router } from "express";
import { showDoc, show404 } from "../controllers/default-controller.js";

export const router = Router();

router.get("/", showDoc);
router.all("*", show404);
