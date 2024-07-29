require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { sql } = require("@vercel/postgres");
const MSG_TEMPLATES = require("./data/message-templates");

const {
  INTRO,
  SERVER,
  REJECTED,
  DUPLICATES,
  ADDED,
  ERR_TABLE,
  ERR_SYNTAX,
  ERR_DUPLICATES,
  ERR_SERVER,
  ERR_INSERT,
} = MSG_TEMPLATES;

const app = express();
app.use(express.json());
// Enable CORS for all routes
app.use(cors());

app.get("/", (_, res) => {
  res.json({ msg: INTRO });
});

app.get("/users", async (_, res) => {
  const { rows } = await sql`SELECT * FROM users`;
  res.json(rows);
});

app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { rows } = await sql`SELECT * FROM users WHERE users.id = ${id} `;
  res.json(rows);
});

app.get("/books", async (_, res) => {
  const { rows } = await sql`SELECT * FROM books`;
  res.json(rows);
});

app.get("/books/:id", async (req, res) => {
  const { id } = req.params;
  const { rows } = await sql`SELECT * FROM books WHERE books.id = ${id}`;
  res.json(rows);
});

app.post("/bulk/:table", async (req, res) => {
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
        ({ name }) => name && typeof name === "string" && name !== ""
      );
    // Books payload must have non empty 'title' and 'author' fields (type sting)
    // Also must have non-zero copies field (at least one copy)
    else
      approvedPayload = payload.filter(
        ({ title, author }) =>
          title &&
          author &&
          copies &&
          typeof title === "string" &&
          typeof author === "string" &&
          typeof copies === "number" &&
          title !== "" &&
          author !== "" &&
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
        coverImage && typeof title === "string" ? coverImage : "";
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
    const query = `SELECT name FROM users WHERE ${checkField} IN (${placeholders})`;
    // Query for duplicates
    // const { rows } = await sql.query(query, identifiers);
    // // Return array of duplicate identifiers (names or titles)
    // return rows.map((row) => row[checkField]);

    const check = await sql.query(query, identifiers);
    result = check.rows.map((row) => row[checkField]);
    return result;
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
            const baseIndex = index * 3 + 1;
            const rowPlaceholders = columns
              .map((_, i) => `$${baseIndex + i}`)
              .join(", ");
            return `(${rowPlaceholders})`;
          })
          .join(", ");

  // Build query
  const query = `INSERT INTO users ${
    table === "users" ? "(name)" : "(title, author, coverImage)"
  } VALUES ${sqlPlaceholders}`;

  // Collect query parameters
  const queryParameters =
    table === "users"
      ? finalPayload.map(({ name }) => name)
      : finalPayload
          .map(({ title, author, coverImage }) => [title, author, coverImage])
          .flat();

  // Insert into one of two tables (users or books), depending on the query
  try {
    const { rowCount } = await sql.query(query, queryParameters);
    // Report insertion result
    res.json({
      msg:
        (rejectedByErrors > 0 ? rejectedByErrors + REJECTED + " " : "") +
        (rejectedByDuplicates > 0
          ? rejectedByDuplicates + DUPLICATES + " "
          : "") +
        rowCount +
        ADDED,
    });

    // For the 'books' table we have to fill secondary table 'copies' as well
    if (table === "books") {
      const copiesPlaceholders = finalPayload
        .map((_, index) => `($${index + i})`)
        .join(", ");
      const copiesQuery = `INSERT INTO copies (bookId) VALUES ${copiesPlaceholders}`;
      const copiesParams = finalPayload
        .map(({ id, copies }) => new Array(copies).fill(id))
        .flat();
      await sql.query(copiesQuery, copiesParams);
    }
  } catch (error) {
    console.error(ERR_INSERT, error);
    res.status(500).json({ error: ERR_SERVER });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(SERVER, port);
});
