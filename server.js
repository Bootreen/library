require("dotenv").config();
const express = require("express");
const { sql } = require("@vercel/postgres");
const tablesConfig = require("./data/tables-config");
const {
  filterAndPreparePayload,
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

  if (!tablesConfig[table]) {
    return res.status(400).json({ error: ERR_TABLE });
  }

  const { tableName, mandatoryFields, defaultValues, columns, checkField } =
    tablesConfig[table];
  const { approvedPayload, rejectedRecordsCount } = filterAndPreparePayload(
    payload,
    mandatoryFields,
    defaultValues
  );

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

  try {
    const client = await sql.connect();

    const uniqueIdArray = approvedPayload.map(
      (record) => record.id || record[checkField]
    );
    const existingRecords = await checkDuplicates(
      client,
      tableName,
      uniqueIdArray,
      checkField
    );

    const newRecords = approvedPayload.filter(
      (record) => !existingRecords.includes(record.id || record[checkField])
    );

    if (newRecords.length === 0) {
      return res.status(400).json({
        error: ERR_DUPLICATES,
        msg: 0 + ADDED,
      });
    }

    const { query, queryParameters } = prepareInsertQuery(
      tableName,
      newRecords,
      columns
    );
    console.log(query);
    console.log(queryParameters);
    const { rowCount } = await client.query(query, queryParameters);
    client.release();

    res.json({
      msg:
        (rejectedRecordsCount > 0
          ? rejectedRecordsCount + REJECTED + " "
          : "") +
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
