export const SQL_QUERIES = {
  SELECT_USERS: "SELECT id, name FROM users",
  SELECT_USER_BY_ID: "SELECT id, name FROM users WHERE id = $1",
  SELECT_USER_BY_NAME: "SELECT id, name FROM users WHERE name = $1",
  INSERT_NEW_USER: "INSERT INTO users (name) VALUES ($1) RETURNING id, name",
  PATCH_USER: "UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name",
  DELETE_USER: "DELETE FROM users WHERE id = $1",
  SELECT_USER_RENTALS: `SELECT copyId as "copyId", rentalDate as "rentalDate", books.title as "title", books.id as "bookId" FROM rentals INNER JOIN copies ON rentals.copyId = copies.id INNER JOIN books ON copies.bookId = books.id WHERE rentals.userId = $1 ORDER BY rentals.rentalDate DESC`,
};
