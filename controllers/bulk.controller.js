import {
  buildInsertQuery,
  checkDuplicates,
  checkPayload,
  insertBooksCopies,
} from "../utils/controllers-utils.js";
import { MSG_TEMPLATES } from "../data/message-templates.js";
import { insertByDynamicQuery } from "../database/bulk.operations.js";
const {
  ADDED,
  REJECTED,
  DUPLICATES,
  ERR_SERVER,
  ERR_TABLE,
  ERR_SYNTAX,
  ERR_DUPLICATES,
} = MSG_TEMPLATES;

export const bulkAdd = async (req, res) => {
  const { table } = req.params;
  const { payload } = req.body;
  if (!["users", "books"].includes(table))
    return res.status(400).json({ error: ERR_TABLE });
  const { approvedPayload, isAllFailed } = checkPayload(table, payload);
  if (isAllFailed) return res.status(400).json({ error: ERR_SYNTAX });
  // If books table records misses non-mandatory field 'coverImage'
  // or it has invalid type, set default empty value for this field
  if (table === "books")
    approvedPayload.forEach(({ coverImage }, i) => {
      approvedPayload[i].coverImage =
        coverImage && typeof coverImage === "string" ? coverImage : "";
    });
  const rejectedByErrors = payload.length - approvedPayload.length;
  // Define unique identifier field for the duplicates check
  const checkField = table === "users" ? "name" : "title";
  try {
    const { duplicates, isAllExist } = await checkDuplicates(
      table,
      approvedPayload
    );
    const duplicateIds = duplicates.map((record) => record[checkField]);
    if (isAllExist) return res.status(400).json({ error: ERR_DUPLICATES });
    const finalPayload = approvedPayload.filter(
      (record) => !duplicateIds.includes(record[checkField])
    );
    const rejectedByDuplicates = approvedPayload.length - finalPayload.length;
    const { insertQuery, queryParams } = buildInsertQuery(table, finalPayload);
    // Insert into one of two tables (users or books), depending on the query
    const { rowCount } = await insertByDynamicQuery(insertQuery, queryParams);
    // For the 'books' table we have to fill secondary table 'copies' as well
    if (table === "books") insertBooksCopies(finalPayload);
    // Report insertion result
    res.status(201).json({
      msg:
        (rejectedByErrors > 0 ? rejectedByErrors + REJECTED + " " : "") +
        (rejectedByDuplicates > 0
          ? rejectedByDuplicates + DUPLICATES + " "
          : "") +
        rowCount +
        ADDED,
    });
  } catch (error) {
    console.error(ERR_SERVER, error);
    res.status(500).json({ error: ERR_INSERT });
  }
};
