import { sql } from "@vercel/postgres";
import { SQL_QUERIES } from "./sql-queries.js";
const { INSERT_COPY } = SQL_QUERIES;

export const fetchByDynamicQuery = async (dynamicQuery, dynamicQueryParams) => {
  const { rows } = await sql.query(dynamicQuery, dynamicQueryParams);
  return rows;
};

export const insertByDynamicQuery = async (
  dynamicQuery,
  dynamicQueryParams
) => {
  const { rows, rowCount } = await sql.query(dynamicQuery, dynamicQueryParams);
  return { rows, rowCount };
};

export const insertCopies = async (copyValues, copiesQueryParams) => {
  const copiesQuery = INSERT_COPY + " " + copyValues;
  await sql.query(copiesQuery, copiesQueryParams);
};
