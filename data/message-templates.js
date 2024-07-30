const MSG_TEMPLATES = {
  SERVER: "Server running on port",
  ADDED: " records were successfully added.",
  REJECTED: " records have invalid syntax and were automatically rejected.",
  DUPLICATES:
    " records already exist in database and were automatically rejected.",
  DELETED: `Rental record deleted successfully.`,
  NO_USERS: "There're no users in database",
  NO_BOOKS: "There're no books in database",
  NO_RENTALS: "This copy of the book is not rented",
  ERR_TABLE: "Invalid path or table name",
  ERR_SYNTAX: "All records have failed syntax check, no new records were added",
  ERR_DUPLICATES: "All valid records already exist, no new records were added",
  ERR_SERVER: "Internal Server Error",
  ERR_INSERT: "Error inserting record(s)",
  ERR_NOT_FOUND: "Error 404: path not found",
  ERR_USER_404: "User not found",
  ERR_BOOK_404: "Book not found",
  ERR_NO_COPY: "No free copies left",
};

module.exports = MSG_TEMPLATES;
