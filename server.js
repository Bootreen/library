import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { MSG_TEMPLATES } from "./data/message-templates.js";

import { router as usersRouter } from "./routes/users.routes.js";
import { router as booksRouter } from "./routes/books.routes.js";
import { router as bulkRouter } from "./routes/bulk.routes.js";
import { router as defaultRouter } from "./routes/default.routes.js";

const app = express();

const fileName = fileURLToPath(import.meta.url);
export const dirName = path.dirname(fileName);

app.use(express.json()); // Enable JSON-parsing
app.use(cors()); // Enable CORS for all external domains
app.use(express.static(path.join(dirName, "html"))); // Define static path

app.use("/users", usersRouter); // User operations
app.use("/books", booksRouter); // Book operations
app.use("/bulk", bulkRouter); // Bulk add new users or books
app.use("/", defaultRouter); // Documentation and 404.html

const port = process.env.PORT || 3000;
const { SERVER } = MSG_TEMPLATES;
app.listen(port, () => {
  console.log(SERVER, port);
});
