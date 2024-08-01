import { sql } from "@vercel/postgres";
import { SQL_QUERIES } from "./sql-queries.js";
const {
  SELECT_USERS,
  SELECT_USER_BY_ID,
  SELECT_USER_BY_NAME,
  INSERT_NEW_USER,
  PATCH_USER,
  DELETE_USER,
  SELECT_USER_RENTALS,
} = SQL_QUERIES;

export const fetchUsers = async () => {
  const { rows } = await sql.query(SELECT_USERS);
  const isEmpty = rows.length === 0 ? true : false;
  return { users: rows, isEmpty };
};

export const fetchUser = async (userIdOrName) => {
  const SELECT_USER_QUERY =
    typeof userIdOrName === "number" ? SELECT_USER_BY_ID : SELECT_USER_BY_NAME;
  const queryParams =
    typeof userIdOrName === "string" ? userIdOrName.trim() : userIdOrName;
  const { rows } = await sql.query(SELECT_USER_QUERY, [queryParams]);
  const isNotFound = rows.length === 0 ? true : false;
  return { user: rows[0], isNotFound };
};

export const addNewUser = async (name) => {
  const { rows } = await sql.query(INSERT_NEW_USER, [name.trim()]);
  return rows[0];
};

export const editUserById = async (userId, name) => {
  const { rows } = await sql.query(PATCH_USER, [name, userId]);
  return rows[0];
};

export const deleteUserById = async (userId) =>
  await sql.query(DELETE_USER, [userId]);

export const fetchUserRentals = async (userId) => {
  const { rows } = await sql.query(SELECT_USER_RENTALS, [userId]);
  const isNoRentals = rows.length === 0 ? true : false;
  return { rentals: rows, isNoRentals };
};
