import { Router } from "express";
import { bulkAdd } from "../controllers/bulk-controller.js";

export const router = Router();

router.post("/:table", bulkAdd);
