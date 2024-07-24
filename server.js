require("dotenv").config();
const express = require("express");
const { sql } = require("@vercel/postgres");

const app = express();
app.use(express.json());

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

app.post("/tracks", async (req, res) => {
  const { trackId, name, albumId, artistIds } = req.body;

  // console.log(name);

  const { rowCount } =
    await sql`INSERT INTO tracks (TRACK_ID, NAME, ALBUM_ID, ARTIST_IDS) VALUES
      (${trackId},${name},${albumId},${artistIds})`;

  res.json({
    msg: `A new track ${name} was added, ${rowCount} tracks total.`,
  });
});

app.post("/artists", async (req, res) => {
  const REJECTED =
    " records missed at least one mandatory property and were automatically rejected.";
  const ADDED = " records were successfully added.";

  const { payload } = req.body;
  const rejectedRecordsCount = payload.filter(
    ({ id, name, imageUrl }) => !id || !name || !imageUrl
  ).length;
  const approvedPayload = payload
    // reject records with missed mandatory properties
    .filter(({ id, name, imageUrl }) => id && name && imageUrl)
    // add initial value for empty non-mandatory properties
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

  let valuesString = approvedPayload
    .map((_, index) => {
      const baseIndex = index * 5 + 1;
      return `($${baseIndex}, $${baseIndex + 1}, $${baseIndex + 2},
      $${baseIndex + 3}, $${baseIndex + 4}, CURRENT_TIMESTAMP)`;
    })
    .join(", ");
  const queryParameters = approvedPayload
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

  try {
    const client = await sql.connect();
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

// app.delete("/notes/:id", async (req, res) => {
//   const { id } = req.params;

//   const { rowCount } = await sql`DELETE FROM notes where id = ${id}`;

//   res.json({ msg: `Element with id=${id} successfully deleted` });
// });

// app.patch("/notes/:id", async (req, res) => {
//   const { id } = req.params;
//   const { content, category } = req.body;

//   const { rowCount } =
//     await sql`UPDATE notes SET content = ${content},category = ${category} WHERE id = ${id}`;

//   res.json({ msg: `Element with id=${id} successfully updated` });
// });

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
