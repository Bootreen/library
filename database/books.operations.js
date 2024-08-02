import { sql } from "@vercel/postgres";
import { SQL_QUERIES } from "./sql-queries.js";
const {
  SELECT_BOOKS,
  SELECT_BOOK,
  FIND_COPY,
  INSERT_RENTAL,
  SELECT_RENTAL,
  DELETE_RENTAL,
} = SQL_QUERIES;

export const fetchBooks = async () => {
  const { rows } = await sql.query(SELECT_BOOKS);
  const isEmpty = rows.length === 0 ? true : false;
  return { books: rows, isEmpty };
};

export const fetchBook = async (bookId) => {
  const { rows } = await sql.query(SELECT_BOOK, [bookId]);
  const isNotFound = rows.length === 0 ? true : false;
  return { book: rows[0], isNotFound };
};

export const findBookCopy = async (bookId) => {
  const { rows } = await sql.query(FIND_COPY, [bookId]);
  const isNoCopies = rows.length === 0 ? true : false;
  return { copyId: rows[0].id, isNoCopies };
};

export const addRental = async (userId, copyId) => {
  await sql.query(INSERT_RENTAL, [userId, copyId]);
};

export const fetchRental = async (copyId) => {
  const { rows } = await sql.query(SELECT_RENTAL, [copyId]);
  const isNotRented = rows.length === 0 ? true : false;
  return { rentalId: rows[0].id, isNotRented };
};

export const deleteRental = async (rentalId) =>
  await sql.query(DELETE_RENTAL, [rentalId]);
