import {
  fetchUsers,
  fetchUser,
  addNewUser,
  editUserById,
  deleteUserById,
  fetchUserRentals,
} from "../database/users.operations.js";
import { isSyntaxError } from "../utils/controllers-utils.js";
import { MSG_TEMPLATES } from "../data/message-templates.js";
const {
  DELETED,
  NO_USERS,
  ERR_SYNTAX,
  ERR_SERVER,
  ERR_INSERT,
  ERR_EDIT,
  ERR_DELETE,
  ERR_USER_404,
  ERR_NO_RENTALS,
} = MSG_TEMPLATES;

export const getUsers = async (_, res) => {
  try {
    const { users, isEmpty } = await fetchUsers();
    if (isEmpty) return res.status(204).json({ msg: NO_USERS });
    else res.status(200).json(users);
  } catch (error) {
    console.error(ERR_SERVER, error);
    res.status(500).json({ error: ERR_SERVER });
  }
};

export const getUser = async (req, res) => {
  const { userId } = req.params;
  // We have to specify numeric type for 'userId' parameters,
  // because 'fetchUser' function needs to determine fetch case - id/name
  try {
    const { user, isNotFound } = await fetchUser(Number(userId));
    if (isNotFound) return res.status(404).json({ error: ERR_USER_404 });
    else res.status(200).json(user);
  } catch (error) {
    console.error(ERR_SERVER, error);
    res.status(500).json({ error: ERR_SERVER });
  }
};

export const addUser = async (req, res) => {
  const { name } = req.body;
  if (isSyntaxError("user", [name]))
    return res.status(400).json({ error: ERR_SYNTAX });
  try {
    const { user, isNotFound } = await fetchUser(name);
    // If user already exists, return the existing user
    if (!isNotFound) return res.status(200).json(user);
    const newUser = await addNewUser(name);
    res.status(201).json(newUser);
  } catch (error) {
    console.error(ERR_SERVER, error);
    res.status(500).json({ error: ERR_INSERT });
  }
};

export const editUser = async (req, res) => {
  const { userId } = req.params;
  const { name } = req.body;
  if (isSyntaxError("user", [name]))
    return res.status(400).json({ error: ERR_SYNTAX });
  try {
    const { isNotFound } = await fetchUser(Number(userId));
    if (isNotFound) return res.status(404).json({ error: ERR_USER_404 });
    const patchedUser = await editUserById(userId, name);
    res.status(200).json(patchedUser);
  } catch (error) {
    console.error(ERR_SERVER, error);
    res.status(500).json({ error: ERR_EDIT });
  }
};

export const deleteUser = async (req, res) => {
  const { userId } = req.params;
  const { isNotFound } = await fetchUser(Number(userId));
  if (isNotFound) return res.status(404).json({ error: ERR_USER_404 });
  try {
    await deleteUserById(userId);
    res.status(200).json({ msg: `User with id ${userId} ${DELETED}` });
  } catch (error) {
    console.error(ERR_SERVER, error);
    res.status(500).json({ error: ERR_DELETE });
  }
};

export const getUserRentals = async (req, res) => {
  const { userId } = req.params;
  const { isNotFound } = await fetchUser(Number(userId));
  if (isNotFound) return res.status(404).json({ error: ERR_USER_404 });
  try {
    const { rentals, isNoRentals } = await fetchUserRentals(userId);
    if (isNoRentals) return res.status(404).json({ error: ERR_NO_RENTALS });
    else res.status(200).json(rentals);
  } catch (error) {
    console.error(ERR_SERVER, error);
    res.status(500).json({ error: ERR_SERVER });
  }
};
