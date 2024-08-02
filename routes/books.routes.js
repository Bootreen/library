import { Router } from "express";
import {
  getBooks,
  getBook,
  deleteBook,
  rentBook,
  returnBook,
} from "../controllers/books.controller.js";

export const router = Router();

router.get("/", getBooks);
router.get("/:bookId(\\d+)", getBook);
router.delete("/:bookId(\\d+)", deleteBook);
router.post("/:bookId(\\d+)/rent", rentBook);
router.delete("/:bookId(\\d+)/rent", returnBook);
