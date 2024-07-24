require("dotenv").config();
const express = require("express");
const { sql } = require("@vercel/postgres");

const app = express();
app.use(express.json());

const REJECTED =
  " records missed at least one mandatory property and were automatically rejected.";
const ADDED = " records were successfully added.";

app.get("/", (_, res) => {
  res.json({ msg: "Songs DB for the Radio Bootreen" });
});

app.get("/tracks", async (_, res) => {
  const { rows } = await sql`SELECT * FROM tracks`;
  res.json(rows);
});

app.get("/artists", async (_, res) => {
  const { rows } = await sql`SELECT * FROM artists`;
  res.json(rows);
});

app.get("/tracks/:id", async (req, res) => {
  const { id } = req.params;
  const { rows } = await sql`SELECT * FROM tracks WHERE tracks.id = ${id} `;
  res.json(rows);
});

// app.post("/tracks", async (req, res) => {
//   const { trackId, name, albumId, artistIds } = req.body;

//   // console.log(name);

//   const { rowCount } =
//     await sql`INSERT INTO tracks (TRACK_ID, NAME, ALBUM_ID, ARTIST_IDS) VALUES
//       (${trackId},${name},${albumId},${artistIds})`;

//   res.json({
//     msg: `A new track ${name} was added, ${rowCount} tracks total.`,
//   });
// });

app.post("/artists", async (req, res) => {
  const { payload } = req.body;

  // Filter out records with missing mandatory properties
  const rejectedRecordsCount = payload.filter(
    ({ id, name, imageUrl }) => !id || !name || !imageUrl
  ).length;

  const approvedPayload = payload
    // Reject records with missing mandatory properties
    .filter(({ id, name, imageUrl }) => id && name && imageUrl)
    // Add initial value for empty non-mandatory properties
    .map((record) =>
      record.popularity ? record : { ...record, popularity: 0 }
    )
    .map((record) => (record.genres ? record : { ...record, genres: [] }));

  if (approvedPayload.length === 0) {
    return res.status(400).json({
      error: "Query syntax error, all records were rejected",
      msg: `${
        rejectedRecordsCount > 0 ? rejectedRecordsCount + REJECTED : ""
      } 0${ADDED}`,
    });
  }

  try {
    const client = await sql.connect();

    // Check for existing records based on id
    const existingIdsQuery = `
      SELECT id FROM Artists WHERE id = ANY($1::text[])
    `;
    const existingIdsResult = await client.query(existingIdsQuery, [
      approvedPayload.map((record) => record.id),
    ]);
    const existingIds = existingIdsResult.rows.map((row) => row.id);

    // Filter out records that already exist
    const newRecords = approvedPayload.filter(
      (record) => !existingIds.includes(record.id)
    );

    if (newRecords.length === 0) {
      return res.status(400).json({
        error: "All records already exist",
        msg: `0${ADDED}`,
      });
    }

    // Prepare values string and parameters for the query
    let valuesString = newRecords
      .map((_, index) => {
        const baseIndex = index * 5 + 1;
        return `($${baseIndex}, $${baseIndex + 1}, $${baseIndex + 2},
        $${baseIndex + 3}, $${baseIndex + 4}, CURRENT_TIMESTAMP)`;
      })
      .join(", ");

    const queryParameters = newRecords
      .map(({ id, name, popularity, genres, imageUrl }) => [
        id,
        name,
        popularity,
        genres,
        imageUrl,
      ])
      .flat();

    const query = `
      INSERT INTO Artists (ID, NAME, POPULARITY, GENRES, IMAGE_URL, CREATED_AT)
      VALUES ${valuesString}
    `;

    const { rowCount } = await client.query(query, queryParameters);
    client.release();

    res.json({
      msg: `${
        rejectedRecordsCount > 0 ? rejectedRecordsCount + REJECTED : ""
      } ${rowCount}${ADDED}`,
    });
  } catch (error) {
    console.error("Error inserting records:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/albums", async (req, res) => {
  const { payload } = req.body;

  // Filter out records with missing mandatory properties
  const rejectedRecordsCount = payload.filter(
    ({ id, name, imageUrl }) => !id || !name || !imageUrl
  ).length;

  const approvedPayload = payload
    // Reject records with missing mandatory properties
    .filter(({ id, name, imageUrl }) => id && name && imageUrl)
    // Add initial value for empty non-mandatory properties
    .map((record) => ({
      ...record,
      release_date: record.release_date || "",
      popularity: record.popularity || 0,
      genres: record.genres || [],
    }));

  if (approvedPayload.length === 0) {
    return res.status(400).json({
      error: "Query syntax error, all records were rejected",
      msg: `${
        rejectedRecordsCount > 0 ? rejectedRecordsCount + REJECTED : ""
      } 0${ADDED}`,
    });
  }

  try {
    const client = await sql.connect();

    // Check for existing records based on id
    const existingIdsQuery = `
      SELECT id FROM Albums WHERE id = ANY($1::text[])
    `;
    const existingIdsResult = await client.query(existingIdsQuery, [
      approvedPayload.map((record) => record.id),
    ]);
    const existingIds = existingIdsResult.rows.map((row) => row.id);

    // Filter out records that already exist
    const newRecords = approvedPayload.filter(
      (record) => !existingIds.includes(record.id)
    );

    if (newRecords.length === 0) {
      return res.status(400).json({
        error: "All records already exist",
        msg: `0${ADDED}`,
      });
    }

    // Prepare values string and parameters for the query
    let valuesString = newRecords
      .map((_, index) => {
        const baseIndex = index * 6 + 1;
        return `($${baseIndex}, $${baseIndex + 1}, $${baseIndex + 2},
        $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5},
        CURRENT_TIMESTAMP)`;
      })
      .join(", ");

    const queryParameters = newRecords
      .map(({ id, name, release_date, popularity, genres, imageUrl }) => [
        id,
        name,
        release_date,
        popularity,
        genres,
        imageUrl,
      ])
      .flat();

    const query = `
      INSERT INTO Albums (ID, NAME, RELEASE_DATE, POPULARITY,
      GENRES, IMAGE_URL, CREATED_AT)
      VALUES ${valuesString}
    `;

    const { rowCount } = await client.query(query, queryParameters);
    client.release();

    res.json({
      msg: `${
        rejectedRecordsCount > 0 ? rejectedRecordsCount + REJECTED : ""
      } ${rowCount}${ADDED}`,
    });
  } catch (error) {
    console.error("Error inserting records:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/genres", async (req, res) => {
  const { payload } = req.body;

  // Filter out records with missing mandatory properties
  const rejectedRecordsCount = payload.filter(({ name }) => !name).length;

  const approvedPayload = payload
    // Reject records with missing mandatory properties
    .filter(({ name }) => name)
    // Add initial value for empty non-mandatory properties
    .map((record) =>
      record.description ? record : { ...record, description: "" }
    );

  if (approvedPayload.length === 0) {
    return res.status(400).json({
      error: "Query syntax error, all records were rejected",
      msg: `${
        rejectedRecordsCount > 0 ? rejectedRecordsCount + REJECTED : ""
      } 0${ADDED}`,
    });
  }

  try {
    const client = await sql.connect();

    // Check for existing records
    const existingNamesQuery = `
      SELECT name FROM Genres WHERE name = ANY($1::text[])
    `;
    const existingNamesResult = await client.query(existingNamesQuery, [
      approvedPayload.map((record) => record.name),
    ]);
    const existingNames = existingNamesResult.rows.map((row) => row.name);

    // Filter out records that already exist
    const newRecords = approvedPayload.filter(
      (record) => !existingNames.includes(record.name)
    );

    if (newRecords.length === 0) {
      return res.status(400).json({
        error: "All records already exist",
        msg: `0${ADDED}`,
      });
    }

    // Prepare values string and parameters for the query
    let valuesString = newRecords
      .map((_, index) => {
        const baseIndex = index * 2 + 1;
        return `($${baseIndex}, $${baseIndex + 1}, CURRENT_TIMESTAMP)`;
      })
      .join(", ");

    const queryParameters = newRecords
      .map(({ name, description }) => [name, description])
      .flat();

    const query = `
      INSERT INTO Genres (NAME, DESCRIPTION, CREATED_AT)
      VALUES ${valuesString}
    `;

    const { rowCount } = await client.query(query, queryParameters);
    client.release();

    res.json({
      msg: `${
        rejectedRecordsCount > 0 ? rejectedRecordsCount + REJECTED : ""
      } ${rowCount}${ADDED}`,
    });
  } catch (error) {
    console.error("Error inserting records:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/tracks", async (req, res) => {
  const { payload } = req.body;

  // Filter out records with missing mandatory properties
  const rejectedRecordsCount = payload.filter(
    ({ id, name, album, albumId, duration }) =>
      !id || !name || !album || !albumId || !duration
  ).length;

  // Filter and map the payload
  const approvedPayload = payload
    // Reject records with missing mandatory properties
    .filter(
      ({ id, name, album, albumId, duration }) =>
        id && name && album && albumId && duration
    )
    // Add initial value for empty non-mandatory properties
    .map((record) => ({
      ...record,
      popularity: record.popularity || 0,
      genres: record.genres || [],
      danceability: record.danceability || 0,
      energy: record.energy || 0,
      mode: record.mode || false,
      key: record.key || 0,
      valence: record.valence || 0,
    }));

  if (approvedPayload.length === 0) {
    return res.status(400).json({
      error: "Query syntax error, all records were rejected",
      msg: `${
        rejectedRecordsCount > 0 ? rejectedRecordsCount + REJECTED : ""
      } 0${ADDED}`,
    });
  }

  try {
    const client = await sql.connect();

    // Check for existing records based on id
    const existingIdsQuery = `
      SELECT id FROM Tracks WHERE id = ANY($1::text[])
    `;
    const existingIdsResult = await client.query(existingIdsQuery, [
      approvedPayload.map((record) => record.id),
    ]);
    const existingIds = existingIdsResult.rows.map((row) => row.id);

    // Filter out records that already exist
    const newRecords = approvedPayload.filter(
      (record) => !existingIds.includes(record.id)
    );

    if (newRecords.length === 0) {
      return res.status(400).json({
        error: "All records already exist",
        msg: `0${ADDED}`,
      });
    }

    // Prepare values string and parameters for the query
    let valuesString = newRecords
      .map((_, index) => {
        const baseIndex = index * 12 + 1; // Adjust index for the number of fields
        return `($${baseIndex}, $${baseIndex + 1}, $${baseIndex + 2},
        $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5},
        $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8},
        $${baseIndex + 9}, $${baseIndex + 10}, $${baseIndex + 11},
        CURRENT_TIMESTAMP)`;
      })
      .join(", ");

    const queryParameters = newRecords
      .map(
        ({
          id,
          name,
          album,
          albumId,
          genres,
          duration,
          popularity,
          danceability,
          energy,
          mode,
          key,
          valence,
        }) => [
          id,
          name,
          album,
          albumId,
          genres,
          duration,
          popularity,
          danceability,
          energy,
          mode,
          key,
          valence,
        ]
      )
      .flat();

    const query = `
      INSERT INTO Tracks (ID, NAME, ALBUM, ALBUM_ID, GENRES, DURATION_MS,
      POPULARITY, DANCEABILITY, ENERGY, MODE, KEY, VALENCE, CREATED_AT)
      VALUES ${valuesString}
    `;

    const { rowCount } = await client.query(query, queryParameters);
    client.release();

    res.json({
      msg: `${
        rejectedRecordsCount > 0 ? rejectedRecordsCount + REJECTED : ""
      } ${rowCount}${ADDED}`,
    });
  } catch (error) {
    console.error("Error inserting records:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
