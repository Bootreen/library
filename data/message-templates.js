const MSG_TEMPLATES = {
  INTRO: "Library DB mini-project (c) Oleksii Butrin",
  SERVER: "Server running on port",
  ADDED: " records were successfully added.",
  REJECTED: " records had invalid syntax and were automatically rejected.",
  DUPLICATES:
    " records already exist in database and were automatically rejected.",
  ERR_TABLE: "Invalid path or table name",
  ERR_SYNTAX: "All records have failed syntax check, no new records were added",
  ERR_DUPLICATES: "All valid records already exist, no new records were added",
  ERR_SERVER: "Internal Server Error",
  ERR_INSERT: "Error inserting records:",
};

module.exports = MSG_TEMPLATES;
