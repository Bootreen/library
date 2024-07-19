require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { sql } = require("@vercel/postgres");

console.log(process.env.POSTGRES_USER);

const notes = [
  {
    id: 34,
    text: "Küche aufräumen!",
    category: "cleaning",
  },
  {
    id: 5,
    text: "Kartoffeln kaufen",
    category: "shopping",
  },
  {
    id: 17,
    text: "Wäsche waschen",
    category: "cleaning",
  },
  {
    id: 16,
    text: "Obst kaufen",
    category: "shopping",
  },
];

// function getNextId() {
//   // iterate over the array and find the highest id used. return this number +1
//   let newId = 0;
//   for (let i = 0; i < notes.length; i++) {
//     if (notes[i].id > newId) {
//       newId = notes[i].id;
//     }
//   }
//   return newId + 1;
// }

function getNextId() {
  //[34, 5, 17];
  return Math.max(...notes.map((note) => note.id)) + 1;
}

const app = express();
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.json({ msg: "Hello from the Notes App -This is the demo" });
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
  console.log(req.body);

  // req.body contains the new note object WITHOUT id
  const newNote = req.body;

  // we calculate a new id based on the current content of our notes array

  const { rows } =
    await sql`INSERT INTO  notes (CONTENT, CATEGORY) VALUES (${newNote.content},${newNote.category})`;
  res.json({
    msg: `A new element with content = ${newNote.content} and category= ${newNote.category} was added.`,
  });
});

app.delete("/notes/:id", async (req, res) => {
  const { id } = req.params;
  await sql`DELETE FROM notes where id = ${id}`;
  res.json({ msg: `Element with id=${id} successfully deleted` });
  // console.log("id", id);

  // const index = notes.findIndex((note) => note.id === Number(id));

  // if (index > -1) {
  //   notes.splice(index, 1);
  //   res.json({ msg: `Element with id=${id} successfully deleted` });
  // } else {
  //   res.status(404).json({ msg: "resource not found" });
  // }
});

app.patch("/notes/:id", async (req, res) => {
  const { id } = req.params;
  const { content, category } = req.body;
  await sql`UPDATE notes SET content = ${content},category = ${category}  
  WHERE id = ${id}`;
  res.json({ msg: `Element with id=${id} successfully updated` });
  // const index = notes.findIndex((note) => note.id === Number(id));

  // if (index > -1) {
  //   notes[index].text = text;
  //   notes[index].category = category;
  //   res.json(notes[index]);
  // } else {
  //   res.status(404).json({ msg: "resource not found" });
  // }
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
