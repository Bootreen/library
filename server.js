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
  NO_USERS,
  NO_BOOKS,
  NO_RENTALS,
  ADDED,
  ERR_TABLE,
  ERR_SYNTAX,
  ERR_DUPLICATES,
  ERR_SERVER,
  ERR_INSERT,
  ERR_NOT_FOUND,
  ERR_USER_404,
  ERR_BOOK_404,
  ERR_NO_COPY,
} = MSG_TEMPLATES;

const app = express();
app.use(express.json());
// Enable CORS for all external domains
app.use(cors());

app.get("/", (_, res) => {
  res.json({ msg: INTRO });
});

// Show all users
app.get("/users", async (_, res) => {
  const query = `SELECT id, name FROM users`;
  const { rows } = await sql.query(query);
  if (rows.length === 0) {
    return res.status(204).json({ msg: NO_USERS });
  }
  res.json(rows);
});

// Show particular user, only numeric id is accepted
app.get("/users/:id(\\d+)", async (req, res) => {
  const { id } = req.params;
  const query = `SELECT id, name FROM users WHERE user.id = ${id}`;
  const { rows } = await sql.query(query);
  if (rows.length === 0) {
    return res.status(404).json({ error: ERR_USER_404 });
  }
  res.json(rows);
});

// Show all books
app.get("/books", async (_, res) => {
  const query = `SELECT
      books.id,
      books.title,
      books.author,
      books.coverImage,
      COUNT(copies.id) as totalCopies,
      COUNT(copies.id) - COUNT(rentals.id) as copiesInStock
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
  // Camelcase for copies count keys
  rows.forEach((record) => {
    delete Object.assign(record, { totalCopies: record.totalcopies })
      .totalcopies;
    delete Object.assign(record, { copiesInStock: record.copiesinstock })
      .copiesinstock;
  });
  res.json(rows);
});

// Show particular book, only numeric id is accepted
app.get("/books/:id(\\d+)", async (req, res) => {
  const { id } = req.params;
  const query = `SELECT
      books.id,
      books.title,
      books.author,
      books.coverImage,
      COUNT(copies.id) as totalCopies,
      COUNT(copies.id) - COUNT(rentals.id) as copiesInStock
    FROM
      books
      LEFT JOIN copies ON books.id = copies.bookId
      LEFT JOIN rentals ON copies.id = rentals.copyId
    WHERE
      books.id = $1
    GROUP BY
      books.id`;
  const { rows } = await sql.query(query, [id]);
  if (rows.length === 0) {
    return res.status(404).json({ error: ERR_BOOK_404 });
  }
  // Camelcase for copies count keys
  rows.forEach((record) => {
    delete Object.assign(record, { totalCopies: record.totalcopies })
      .totalcopies;
    delete Object.assign(record, { copiesInStock: record.copiesinstock })
      .copiesinstock;
  });
  res.json(rows);
});

// Renting books API endpoint
app.post("/books/:id(\\d+)/rent", async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    // Find an available copy
    const findCopyQuery = `
      SELECT copies.id
      FROM copies
      LEFT JOIN rentals ON copies.id = rentals.copyId
      WHERE copies.bookId = $1 AND rentals.copyId IS NULL
      LIMIT 1`;
    const { rows: availableCopies } = await sql.query(findCopyQuery, [id]);

    // No available copies left
    if (availableCopies.length === 0) {
      return res.status(400).json({ error: ERR_NO_COPY });
    }
    const copyId = availableCopies[0].id;

    // Insert the rental record
    const insertRentalQuery = `
      INSERT INTO rentals (userId, copyId, rentalDate)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      RETURNING id`;
    const { rows } = await sql.query(insertRentalQuery, [userId, copyId]);

    res.status(201).json({ rentalId: rows[0].id });
  } catch (error) {
    console.error(ERR_INSERT, error);
    res.status(500).json({ error: ERR_SERVER });
  }
});

// Show all rentals by user
app.get("/users/:userId(\\d+)/rentals", async (req, res) => {
  const { userId } = req.params;

  // Check if user exists
  const userCheckQuery = `SELECT id FROM users WHERE id = $1`;
  const { rows: userRows } = await sql.query(userCheckQuery, [userId]);
  if (userRows.length === 0) {
    return res.status(404).json({ error: ERR_USER_404 });
  }

  try {
    const query = `SELECT
        copyId,
        rentalDate,
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
      return res.status(404).json({ error: NO_RENTALS });
    }
    res.json(rows);
  } catch (error) {
    console.error(ERR_SERVER, error);
    res.status(500).json({ error: ERR_SERVER });
  }
});

// Bulk insert new users and books API endpoint
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
        ({ title, author, copies }) =>
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
});

app.all("*", (_, res) => {
  res.status(404).json({ error: ERR_NOT_FOUND });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(SERVER, port);
});
