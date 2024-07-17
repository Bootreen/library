const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Hello world from express");
});

app.get("/notes", (req, res) => {
  res.send("Hello world from /notes route");
});

app.listen(3000, () => {
  console.log("Served started on port 3000");
});
