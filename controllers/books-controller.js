import { sql } from "@vercel/postgres";
import { MSG_TEMPLATES } from "../data/message-templates.js";

const {
  DELETED,
  NO_BOOKS,
  ERR_BOOK_404,
  ERR_SERVER,
  ERR_NO_COPY,
  ERR_NOT_RENTED,
} = MSG_TEMPLATES;

export const getBooks = async (_, res) => {
  const query = `SELECT
      books.id,
      books.title,
      books.author,
      books.coverImage as "coverImage",
      COUNT(copies.id) as "totalCopies",
      COUNT(copies.id) - COUNT(rentals.id) as "copiesInStock"
    FROM
      books
      LEFT JOIN copies ON books.id = copies.bookId
      LEFT JOIN rentals ON copies.id = rentals.copyId
    GROUP BY
      books.id
    ORDER BY
      books.id`;
  const { rows } = await sql.query(query);
  if (rows.length === 0) {
    return res.status(204).json({ msg: NO_BOOKS });
  }
  res.json(rows);
};

export const getBook = async (req, res) => {
  const { bookId } = req.params;
  const query = `SELECT
      books.id,
      books.title,
      books.author,
      books.coverImage as "coverImage",
      COUNT(copies.id) as "totalCopies",
      COUNT(copies.id) - COUNT(rentals.id) as "copiesInStock"
    FROM
      books
      LEFT JOIN copies ON books.id = copies.bookId
      LEFT JOIN rentals ON copies.id = rentals.copyId
    WHERE
      books.id = $1
    GROUP BY
      books.id`;
  const { rows } = await sql.query(query, [bookId]);
  if (rows.length === 0) {
    return res.status(404).json({ error: ERR_BOOK_404 });
  }
  res.json(rows[0]);
};

export const rentBook = async (req, res) => {
  const { bookId } = req.params;
  const { userId } = req.body;

  try {
    // Find an available copy
    const findCopyQuery = `
      SELECT copies.id
      FROM copies
      LEFT JOIN rentals ON copies.id = rentals.copyId
      WHERE copies.bookId = $1 AND rentals.copyId IS NULL
      LIMIT 1`;
    const { rows: availableCopies } = await sql.query(findCopyQuery, [bookId]);

    // No available copies left
    if (availableCopies.length === 0) {
      return res.status(400).json({ error: ERR_NO_COPY });
    }
    const copyId = availableCopies[0].id;

    // Insert the rental record
    const insertRentalQuery = `
      INSERT INTO rentals (userId, copyId, rentalDate)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      RETURNING copyId`;
    const { rows } = await sql.query(insertRentalQuery, [userId, copyId]);

    res.status(201).json({ copyId: rows[0].copyid });
  } catch (error) {
    console.error(ERR_INSERT, error);
    res.status(500).json({ error: ERR_SERVER });
  }
};

export const returnBook = async (req, res) => {
  const { copyId } = req.body;

  try {
    // Check if the rental record exists
    const checkQuery = `
      SELECT rentals.id
      FROM rentals
      WHERE rentals.copyId = $1
    `;
    const { rows } = await sql.query(checkQuery, [copyId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: ERR_NOT_RENTED });
    }

    // Delete the rental record
    const rentalId = rows[0].id;
    const deleteQuery = `
      DELETE FROM rentals
      WHERE id = $1`;
    await sql.query(deleteQuery, [rentalId]);

    res.status(200).json({ msg: `Rental with copy id ${copyId} ${DELETED}` });
  } catch (error) {
    console.error(ERR_SERVER, error);
    res.status(500).json({ error: ERR_SERVER });
  }
};
