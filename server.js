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
