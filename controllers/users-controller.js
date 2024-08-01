import { sql } from "@vercel/postgres";
import { MSG_TEMPLATES } from "../data/message-templates.js";

const {
  DELETED,
  NO_USERS,
  ERR_SYNTAX,
  ERR_SERVER,
  ERR_USER_404,
  ERR_NO_RENTALS,
} = MSG_TEMPLATES;

export const getUsers = async (_, res) => {
  const query = `SELECT id, name FROM users`;
  const { rows } = await sql.query(query);
  // From the formal point of view HTTP status 204 (No Content)
  // is not an error, it just indicates that this table is empty
  if (rows.length === 0) {
    return res.status(204).json({ msg: NO_USERS });
  }
  res.json(rows);
};

export const getUser = async (req, res) => {
  const { userId } = req.params;
  const query = `SELECT id, name FROM users WHERE id = $1`;
  const { rows } = await sql.query(query, [userId]);
  if (rows.length === 0) {
    return res.status(404).json({ error: ERR_USER_404 });
  }
  res.json(rows[0]);
};

export const addUser = async (req, res) => {
  const { name } = req.body;
  // Check for syntax errors
  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ error: ERR_SYNTAX });
  }

  try {
    // Check for duplicates
    const duplicateCheckQuery = `SELECT id, name FROM users WHERE name = $1`;
    const { rows: duplicateRows } = await sql.query(duplicateCheckQuery, [
      name,
    ]);

    if (duplicateRows.length > 0) {
      // User already exists, return the existing user
      return res.status(200).json(duplicateRows[0]);
    }
    // Insert new user
    const insertUserQuery = `
      INSERT INTO users (name)
      VALUES ($1)
      RETURNING id, name
    `;
    const { rows } = await sql.query(insertUserQuery, [name]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(ERR_SERVER, error);
    res.status(500).json({ error: ERR_SERVER });
  }
};

export const editUser = async (req, res) => {
  const { userId } = req.params;
  const { name } = req.body;
  const query = `SELECT id, name FROM users WHERE id = $1`;
  const { rows } = await sql.query(query, [userId]);
  if (rows.length === 0) {
    return res.status(404).json({ error: ERR_USER_404 });
  }
  // Check for syntax errors
  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ error: ERR_SYNTAX });
  }

  try {
    // Update user name
    const patchUserQuery = `
      UPDATE users
      SET name = $1
      WHERE id = $2
      RETURNING id, name
    `;
    const { rows: updatedRows } = await sql.query(patchUserQuery, [
      name,
      userId,
    ]);

    res.status(200).json(updatedRows[0]);
  } catch (error) {
    console.error(ERR_SERVER, error);
    res.status(500).json({ error: ERR_SERVER });
  }
};

export const deleteUser = async (req, res) => {
  const { userId } = req.params;
  const query = `SELECT id, name FROM users WHERE id = $1`;
  const { rows } = await sql.query(query, [userId]);
  if (rows.length === 0) {
    return res.status(404).json({ error: ERR_USER_404 });
  }

  try {
    const deleteUserQuery = `
      DELETE FROM users
      WHERE id = $1
    `;
    await sql.query(deleteUserQuery, [userId]);
    res.status(200).json({ msg: `User with id ${userId} ${DELETED}` });
  } catch (error) {
    console.error(ERR_SERVER, error);
    res.status(500).json({ error: ERR_SERVER });
  }
};

export const getUserRentals = async (req, res) => {
  const { userId } = req.params;

  // Check if user exists
  const userCheckQuery = `SELECT id FROM users WHERE id = $1`;
  const { rows: userRows } = await sql.query(userCheckQuery, [userId]);
  if (userRows.length === 0) {
    return res.status(404).json({ error: ERR_USER_404 });
  }

  try {
    const query = `SELECT
        copyId as "copyId",
        rentalDate as "rentalDate",
        books.title as "title",
        books.id as "bookId"
      FROM
        rentals
        INNER JOIN copies ON rentals.copyId = copies.id
        INNER JOIN books ON copies.bookId = books.id
      WHERE
        rentals.userId = $1
      ORDER BY
        rentals.rentalDate DESC`;

    const { rows } = await sql.query(query, [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: ERR_NO_RENTALS });
    }
    res.json(rows);
  } catch (error) {
    console.error(ERR_SERVER, error);
    res.status(500).json({ error: ERR_SERVER });
  }
};
