require("dotenv").config();
const express = require("express");
const { sql } = require("@vercel/postgres");
const tablesConfig = require("./data/tables-config");
const {
  preparePayload,
  joinPairs,
  checkDuplicates,
  prepareInsertQuery,
} = require("./utils/sql-helpers");
const MSG_TEMPLATES = require("./data/message-templates");

const app = express();
app.use(express.json());

const {
  INTRO,
  SERVER,
  REJECTED,
  EXIST,
  ADDED,
  ERR_SERVER,
  ERR_TABLE,
  ERR_QUERY,
  ERR_DUPLICATES,
  ERR_INSERT,
} = MSG_TEMPLATES;

app.get("/", (_, res) => {
  res.json({ msg: INTRO });
});

app.get("/tracks", async (_, res) => {
  const { rows } = await sql`SELECT * FROM tracks`;
  res.json(rows);
});

app.get("/tracks/:id", async (req, res) => {
  const { id } = req.params;
  const { rows } = await sql`SELECT * FROM tracks WHERE tracks.id = ${id} `;
  res.json(rows);
});

app.get("/artists", async (_, res) => {
  const { rows } = await sql`SELECT * FROM artists`;
  res.json(rows);
});

app.post("/:table", async (req, res) => {
  const { table } = req.params;
  const { payload } = req.body;

  // Unsupported path/table name
  if (!tablesConfig[table]) {
    return res.status(400).json({ error: ERR_TABLE });
  }

  // Read current table config
  const { tableName, mandatoryFields, defaultValues, columns, checkField } =
    tablesConfig[table];

  const isJunction = !defaultValues;

  // Check payload for mandatory fields existance
  // and fill out default values if needed
  const { approvedPayload, rejectedRecordsCount } = preparePayload(
    payload,
    mandatoryFields,
    defaultValues
  );

  // If all of the records break syntax rules and was rejected
  if (approvedPayload.length === 0) {
    return res.status(400).json({
      error: ERR_QUERY,
      msg:
        (rejectedRecordsCount > 0
          ? rejectedRecordsCount + REJECTED + " "
          : "") +
        0 +
        ADDED,
    });
  }

  const finalPayload = isJunction
    ? joinPairs(approvedPayload)
    : approvedPayload;

  try {
    const client = await sql.connect();

    // Gather unique identifiers for the current table (id or other field)
    const uniqueIdArray = finalPayload.map(
      (record) => record.id || record[checkField]
    );

    // Check if some of payload records are already in database
    const existingRecordsIds = isJunction
      ? [] // Junction tables check for duplicates in a different way
      : await checkDuplicates(client, tableName, uniqueIdArray, checkField);

    // Filter out duplicates
    const newRecords = finalPayload.filter(
      (record) => !existingRecordsIds.includes(record.id || record[checkField])
    );

    console.log(newRecords);

    // Count duplicates
    const duplicateRecordsCount = finalPayload.length - newRecords.length;

    // No new records at all
    if (newRecords.length === 0) {
      return res.status(400).json({
        error: ERR_DUPLICATES,
        msg: 0 + ADDED,
      });
    }

    // Parse payload into SQL-query
    const { query, queryParameters } = prepareInsertQuery(
      isJunction,
      tableName,
      newRecords,
      columns
    );

    // Add payload records and retrieve added row total count
    const { rowCount } = await client.query(query, queryParameters);
    client.release();

    // Display final result:
    // rejected by syntax error and duplicate check
    // added successfully
    res.json({
      msg:
        (rejectedRecordsCount > 0
          ? rejectedRecordsCount + REJECTED + " "
          : "") +
        (duplicateRecordsCount > 0 ? duplicateRecordsCount + EXIST + " " : "") +
        rowCount +
        ADDED,
    });
  } catch (error) {
    console.error(ERR_INSERT, error);
    res.status(500).json({ error: ERR_SERVER });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(SERVER, port);
});
