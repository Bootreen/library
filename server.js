import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { MSG_TEMPLATES } from "./data/message-templates.js";

import {
  getUsers,
  getUser,
  addUser,
  editUser,
  deleteUser,
  getUserRentals,
} from "./controllers/users.js";

import {
  getBooks,
  getBook,
  rentBook,
  returnBook,
} from "./controllers/books.js";
import { bulkAdd } from "./controllers/bulk.js";

const app = express();
const fileName = fileURLToPath(import.meta.url);
const dirName = path.dirname(fileName);

app.use(express.json()); // Enable JSON-parsing
app.use(cors()); // Enable CORS for all external domains
app.use(express.static(path.join(dirName, "html"))); // Define static path

// Show documentation
app.get("/", (_, res) => {
  res.sendFile(path.join(dirName, "html", "api-docs.html"));
});

app.get("/users", getUsers);
app.get("/users/:userId(\\d+)", getUser);
app.get("/users/:userId(\\d+)/rentals", getUserRentals);
app.post("/users", addUser);
app.patch("/users/:userId", editUser);
app.delete("/users/:userId", deleteUser);

app.get("/books", getBooks);
app.get("/books/:bookId(\\d+)", getBook);
app.post("/books/:id(\\d+)/rent", rentBook);
app.delete("/books/:id(\\d+)/rent", returnBook);

// Bulk add new users or books
app.post("/bulk/:table", bulkAdd);

// Error 404 handling
app.all("*", (_, res) => {
  res.status(404).sendFile(path.join(dirName, "html", "404.html"));
});

const port = process.env.PORT || 3000;
const { SERVER } = MSG_TEMPLATES;
app.listen(port, () => {
  console.log(SERVER, port);
});
