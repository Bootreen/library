const MSG_TEMPLATES = {
  INTRO: "Songs DB for the Radio Bootreen",
  SERVER: "Server running on port",
  REJECTED:
    " records missed at least one mandatory property and were automatically rejected.",
  ADDED: " records were successfully added.",
  ERR_TABLE: "Invalid table name",
  ERR_QUERY: "Query syntax error, all records were rejected",
  ERR_SERVER: "Internal Server Error",
  ERR_DUPLICATES: "All records already exist",
  ERR_INSERT: "Error inserting records:",
};

module.exports = MSG_TEMPLATES;
