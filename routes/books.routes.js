import { Router } from "express";
import {
  getBooks,
  getBook,
  rentBook,
  returnBook,
} from "../controllers/books.controller.js";

export const router = Router();

router.get("/", getBooks);
router.get("/:bookId(\\d+)", getBook);
router.post("/:bookId(\\d+)/rent", rentBook);
router.delete("/:bookId(\\d+)/rent", returnBook);
