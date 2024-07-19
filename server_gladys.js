const express = require("express");

const notes = [
  {
    id: 1,
    text: "Küche aufräumen",
  },
  {
    id: 2,
    text: "Einkaufen",
  },
  {
    id: 3,
    text: "Wäsche waschen",
  },
];
function getNextId(notes) {
  let highestId = 0;
  for (leti = 0; i < notes.length; i++) {
    if (notes[i].id > highestId) {
      highestId = notes[i].id;
    }
  }
  return highestId + 1;
}
const app = express();

app.get("/", (req, res) => {
  res.send("Hello world from express");
});

app.get("/notes", (req, res) => {
  res.send(notes);
});

app.get("/notes/:id", (req, res) => {
  console.log(req.params);
  //we know that params contains a "id" property
  const { id } = req.params;

  const note = notes.find((note) => {
    note.id === Number(id);

    if (note) {
      req.json(note);
    } else {
      res.status(404).json({ error: "page not found" });
    }
  });
  res.send("This in /notes/:id route");
});

app.post("/notes", (req, res) => {
  console.log(req.body);
  const nextId = getNextId();
  notes.push({
    ...req.body,
    id: nextId,
  });
  res.json({ msg: "This is the POST /notes route" });
});

app.listen(3000, () => {
  console.log("Served started on port 3000");
});
