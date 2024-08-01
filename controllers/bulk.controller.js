import { sql } from "@vercel/postgres";
import { MSG_TEMPLATES } from "../data/message-templates.js";

const {
  ADDED,
  REJECTED,
  DUPLICATES,
  ERR_SERVER,
  ERR_TABLE,
  ERR_SYNTAX,
  ERR_DUPLICATES,
} = MSG_TEMPLATES;

export const bulkAdd = async (req, res) => {
  const { table } = req.params;
  const { payload } = req.body;

  if (!["users", "books"].includes(table)) {
    return res.status(400).json({ error: ERR_TABLE });
  }

  const checkPayloadSyntax = (table) => {
    let approvedPayload = [];
    if (table === "users")
      // Users payload must have non empty 'name' field (type sting)
      approvedPayload = payload.filter(
        ({ name }) => name && typeof name === "string" && name.trim() !== ""
      );
    // Books payload must have non empty 'title' and 'author' fields (type sting)
    // Also must have non-zero copies field (at least one copy)
    else
      approvedPayload = payload.filter(
        ({ title, author, copies }) =>
          title &&
          author &&
          copies &&
          typeof title === "string" &&
          typeof author === "string" &&
          typeof copies === "number" &&
          title.trim() !== "" &&
          author.trim() !== "" &&
          copies > 0
      );
    return approvedPayload;
  };

  // Filter out all invalid records
  const approvedPayload = checkPayloadSyntax(table);
  // All records have failed syntax check
  if (approvedPayload.length === 0) {
    return res.status(400).json({ error: ERR_SYNTAX });
  }
  // If books table records misses non-mandatory field 'coverImage'
  // or it has invalid type, set default empty value for this field
  if (table === "books")
    approvedPayload.forEach(({ coverImage }, i) => {
      approvedPayload[i].coverImage =
        coverImage && typeof coverImage === "string" ? coverImage : "";
    });
  // Count records, that was rejected by the syntax errors
  const rejectedByErrors = payload.length - approvedPayload.length;
  // Define unique identifier field for the duplicates check
  const checkField = table === "users" ? "name" : "title";

  const checkDuplicates = async (identifiers) => {
    // Build SQL parameters placeholders
    const placeholders = identifiers
      .map((_, index) => `$${index + 1}`)
      .join(",");
    // Build SQL query
    const query = `SELECT ${checkField} FROM ${table} WHERE ${checkField} IN (${placeholders})`;
    // Query for duplicates
    const { rows } = await sql.query(query, identifiers);
    // Return array of duplicate identifiers (names or titles)
    return rows.map((row) => row[checkField]);
  };

  // Gather identifiers
  const identifiers = approvedPayload.map((record) => record[checkField]);
  // Check for the duplicates and filter them out
  const duplicates = await checkDuplicates(identifiers);
  const finalPayload = approvedPayload.filter(
    (record) => !duplicates.includes(record[checkField])
  );
  // All valid records already exist
  if (finalPayload.length === 0) {
    return res.status(400).json({ error: ERR_DUPLICATES });
  }
  // Count records, that was rejected by duplicates
  const rejectedByDuplicates = approvedPayload.length - finalPayload.length;

  // Build SQL placeholders
  const sqlPlaceholders =
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

  // Build query
  const columns = table === "users" ? "(name)" : "(title, author, coverImage)";
  // We need to return the book id because payload "knows" nothing about id
  const returningData = table === "books" ? "RETURNING id" : "";
  const query = `INSERT INTO ${table} ${columns} VALUES ${sqlPlaceholders} ${returningData}`;

  // Collect query parameters
  const queryParameters =
    table === "users"
      ? finalPayload.map(({ name }) => name)
      : finalPayload
          .map(({ title, author, coverImage }) => [title, author, coverImage])
          .flat();

  // Insert into one of two tables (users or books), depending on the query
  try {
    const { rows, rowCount } = await sql.query(query, queryParameters);
    // For the 'books' table we have to fill secondary table 'copies' as well
    if (table === "books") {
      for (let i = 0; i < finalPayload.length; i++) {
        // Take book id from SQL INSERT RETURNING
        const { id } = rows[i];
        // Take copies number from the payload itself
        const { copies } = finalPayload[i];
        // Insert copies into 'copies' table
        const copyValues = new Array(copies)
          .fill("")
          .map((_, index) => `($${index + 1})`)
          .join(",");
        const copiesQuery = `INSERT INTO copies (bookId) VALUES ${copyValues}`;
        const copyParams = new Array(copies).fill(id);
        await sql.query(copiesQuery, copyParams);
      }
    }

    // Report insertion result
    res.status(201).json({
      msg:
        (rejectedByErrors > 0 ? rejectedByErrors + REJECTED + " " : "") +
        (rejectedByDuplicates > 0
          ? rejectedByDuplicates + DUPLICATES + " "
          : "") +
        rowCount +
        ADDED,
    });
  } catch (error) {
    console.error(ERR_INSERT, error);
    res.status(500).json({ error: ERR_SERVER });
  }
};
