import {
  fetchBooks,
  fetchBook,
  findBookCopy,
  addRental,
  fetchRental,
  deleteRental,
} from "../database/books.operations.js";
import { MSG_TEMPLATES } from "../data/message-templates.js";
const {
  DELETED,
  NO_BOOKS,
  ERR_BOOK_404,
  ERR_SERVER,
  ERR_NO_COPY,
  ERR_NOT_RENTED,
  ERR_DELETE,
} = MSG_TEMPLATES;

export const getBooks = async (_, res) => {
  try {
    const { books, isEmpty } = await fetchBooks();
    if (isEmpty) return res.status(204).json({ msg: NO_BOOKS });
    else res.status(200).json(books);
  } catch (error) {
    console.error(ERR_SERVER, error);
    res.status(500).json({ error: ERR_SERVER });
  }
};

export const getBook = async (req, res) => {
  const { bookId } = req.params;
  try {
    const { book, isNotFound } = await fetchBook(bookId);
    if (isNotFound) return res.status(404).json({ msg: ERR_BOOK_404 });
    else res.status(200).json(book);
  } catch (error) {
    console.error(ERR_SERVER, error);
    res.status(500).json({ error: ERR_SERVER });
  }
};

export const rentBook = async (req, res) => {
  const { bookId } = req.params;
  const { userId } = req.body;
  try {
    const { copyId, isNoCopies } = await findBookCopy(bookId);
    if (isNoCopies) return res.status(400).json({ error: ERR_NO_COPY });
    await addRental(userId, copyId);
    res.status(201).json({ copyId });
  } catch (error) {
    console.error(ERR_SERVER, error);
    res.status(500).json({ error: ERR_INSERT });
  }
};

export const returnBook = async (req, res) => {
  const { copyId } = req.body;
  try {
    const { rentalId, isNotRented } = await fetchRental(copyId);
    if (isNotRented) return res.status(404).json({ error: ERR_NOT_RENTED });
    await deleteRental(rentalId);
    res.status(200).json({ msg: `Rental with copy id ${copyId} ${DELETED}` });
  } catch (error) {
    console.error(ERR_SERVER, error);
    res.status(500).json({ error: ERR_DELETE });
  }
};
