export const SQL_QUERIES = {
  SELECT_USERS: "SELECT id, name FROM users",
  SELECT_USER_BY_ID: "SELECT id, name FROM users WHERE id = $1",
  SELECT_USER_BY_NAME: "SELECT id, name FROM users WHERE name = $1",
  INSERT_NEW_USER: "INSERT INTO users (name) VALUES ($1) RETURNING id, name",
  PATCH_USER: "UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name",
  DELETE_USER: "DELETE FROM users WHERE id = $1",
  SELECT_USER_RENTALS: `SELECT copyId as "copyId", rentalDate as "rentalDate", books.title as "title", books.id as "bookId" FROM rentals INNER JOIN copies ON rentals.copyId = copies.id INNER JOIN books ON copies.bookId = books.id WHERE rentals.userId = $1 ORDER BY rentals.rentalDate DESC`,
  SELECT_BOOKS: `SELECT books.id, books.title, books.author, books.coverImage as "coverImage", COUNT(copies.id) as "totalCopies", COUNT(copies.id) - COUNT(rentals.id) as "copiesInStock" FROM books LEFT JOIN copies ON books.id = copies.bookId LEFT JOIN rentals ON copies.id = rentals.copyId GROUP BY books.id`,
  SELECT_BOOK: `SELECT books.id, books.title, books.author, books.coverImage as "coverImage", COUNT(copies.id) as "totalCopies", COUNT(copies.id) - COUNT(rentals.id) as "copiesInStock" FROM books LEFT JOIN copies ON books.id = copies.bookId LEFT JOIN rentals ON copies.id = rentals.copyId WHERE books.id = $1 GROUP BY books.id`,
  FIND_COPY:
    "SELECT copies.id FROM copies LEFT JOIN rentals ON copies.id = rentals.copyId WHERE copies.bookId = $1 AND rentals.copyId IS NULL LIMIT 1",
  INSERT_RENTAL:
    "INSERT INTO rentals (userId, copyId, rentalDate) VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING copyId",
  SELECT_RENTAL: "SELECT rentals.id FROM rentals WHERE rentals.copyId = $1",
  DELETE_RENTAL: "DELETE FROM rentals WHERE id = $1",
  INSERT_COPY: "INSERT INTO copies (bookId) VALUES",
};
