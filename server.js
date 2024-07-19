require("dotenv").config();
const express = require("express");
const { sql } = require("@vercel/postgres");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ msg: "Hello from the Notes App - This is the demo" });
});

app.get("/notes", async (req, res) => {
  const { rows } = await sql`SELECT * FROM notes`;
  res.json(rows);
});

app.get("/notes/:id", async (req, res) => {
  const { id } = req.params;
  const { rows } = await sql`SELECT * FROM notes WHERE notes.id = ${id} `;
  res.json(rows);
});

app.post("/notes", async (req, res) => {
  const newNote = req.body;

  const { rowCount } =
    await sql`INSERT INTO  notes (CONTENT, CATEGORY) VALUES (${newNote.content},${newNote.category})`;

  res.json({
    msg: `A new element with content = ${newNote.content} and category= ${newNote.category} was added.`,
  });
});

app.delete("/notes/:id", async (req, res) => {
  const { id } = req.params;

  const { rowCount } = await sql`DELETE FROM notes where id = ${id}`;

  res.json({ msg: `Element with id=${id} successfully deleted` });
});

app.patch("/notes/:id", async (req, res) => {
  const { id } = req.params;
  const { content, category } = req.body;

  const { rowCount } =
    await sql`UPDATE notes SET content = ${content},category = ${category} WHERE id = ${id}`;

  res.json({ msg: `Element with id=${id} successfully updated` });
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
