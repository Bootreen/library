import path from "path";
import { dirName } from "../server.js";

export const showDoc = (_, res) => {
  res.sendFile(path.join(dirName, "html", "api-docs.html"));
};

export const show404 = (_, res) => {
  res.status(404).sendFile(path.join(dirName, "html", "404.html"));
};
