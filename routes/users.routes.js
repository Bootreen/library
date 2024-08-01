import { Router } from "express";
import {
  getUsers,
  getUser,
  addUser,
  editUser,
  deleteUser,
  getUserRentals,
} from "../controllers/users-controller.js";

export const router = Router();

router.get("/", getUsers);
router.get("/:userId(\\d+)", getUser);
router.get("/:userId(\\d+)/rentals", getUserRentals);
router.post("/", addUser);
router.patch("/:userId(\\d+)", editUser);
router.delete("/:userId(\\d+)", deleteUser);
