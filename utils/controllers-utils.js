import { fetchUsersOrBooks } from "../database/bulk.operations.js";

export const isSyntaxError = (table, payload) => {
  if (table === "users") {
    const { name } = payload;
    const hasError =
      !name || typeof name !== "string" || name.trim() === "" ? true : false;
    return hasError;
  } else if (table === "books") {
    const { title, author, copies } = payload;
    const hasError =
      !title ||
      !author ||
      !copies ||
      typeof title !== "string" ||
      typeof author !== "string" ||
      typeof copies !== "number" ||
      title.trim() === "" ||
      author.trim() === "" ||
      copies === 0;
    return hasError;
  }
};

export const checkPayload = (table, payload) => {
  const approvedPayload = payload.filter(
    (record) => !isSyntaxError(table, record)
  );
  const isAllFailed = approvedPayload.length === 0 ? true : false;
  return { approvedPayload, isAllFailed };
};

export const checkDuplicates = async (table, approvedPayload) => {
  // Define unique identifier field for the duplicates check
  const checkField = table === "users" ? "name" : "title";
  const identifiers = approvedPayload.map((record) => record[checkField]);
  // Build SQL parameters placeholders
  const placeholders = identifiers.map((_, index) => `$${index + 1}`).join(",");
  // Build SQL query
  const query = `SELECT ${checkField} FROM ${table} WHERE ${checkField} IN (${placeholders})`;
  // Query for duplicate ids (names or titles)
  const duplicates = await fetchUsersOrBooks(query, identifiers);
  const isAllExist =
    approvedPayload.length === duplicates.length ? true : false;
  return { duplicates, isAllExist };
};

const buildSqlPlaceholders = (table, finalPayload) =>
  table === "users"
    ? finalPayload.map((_, index) => `($${index + 1})`).join(",")
    : finalPayload
        .map((_, index) => {
          // Books table has 3 field in payload
          // We use this number as index multiplier
          // And rowPlaceholders array length
          const baseIndex = index * 3 + 1;
          const rowPlaceholders = new Array(3)
            .fill(0)
            .map((_, i) => `$${baseIndex + i}`)
            .join(", ");
          return `(${rowPlaceholders})`;
        })
        .join(", ");

export const buildUsersOrBooksQuery = (table, finalPayload) => {
  const sqlPlaceholders = buildSqlPlaceholders(table, finalPayload);
  // Build query
  const columns = table === "users" ? "(name)" : "(title, author, coverImage)";
  // We need to return the book id because payload "knows" nothing about id
  const returningData = table === "books" ? "RETURNING id" : "";
  const insertQuery = `INSERT INTO ${table} ${columns} VALUES ${sqlPlaceholders} ${returningData}`;
  // Collect query parameters
  const queryParams =
    table === "users"
      ? finalPayload.map(({ name }) => name)
      : finalPayload
          .map(({ title, author, coverImage }) => [title, author, coverImage])
          .flat();
  return { insertQuery, queryParams };
};

export const prepareBookCopiesQuery = (bookId, copies) => {
  // Prepare SQL value placeholders for the insert copies query
  const copyValues = new Array(copies)
    .fill("")
    .map((_, index) => `($${index + 1})`)
    .join(",");
  const copyParams = new Array(copies).fill(bookId);
  return { copyValues, copyParams };
};
