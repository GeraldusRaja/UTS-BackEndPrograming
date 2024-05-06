const { hashPassword } = require('../../../utils/password');
const bcrypt = require('bcrypt');
const usersRepository = require('./users-repository');

async function getUsers() {
  const users = await usersRepository.getUsers();

  const results = [];
  for (let i = 0; i < users.length; i += 1) {
    const user = users[i];
    results.push({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  }

  return results;
}

async function getUser(id) {
  const user = await usersRepository.getUser(id);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

async function createUser(name, email, password) {
  const hashedPassword = await hashPassword(password);

  try {
    await usersRepository.createUser(name, email, hashedPassword);
  } catch (err) {
    return null;
  }

  return true;
}

async function updateUser(id, name, email) {
  return await usersRepository.updateUser(id, name, email);
}

async function deleteUser(id) {
  return await usersRepository.deleteUser(id);
}

async function isEmailTaken(email) {
  try {
    const user = await usersRepository.getUserByEmail(email);
    return user !== null;
  } catch (error) {
    console.error('Error checking email:', error);
    throw error;
  }
}

async function getFilteredUsers(page_number = 1, page_size = 10) {
  try {
    const users = await usersRepository.getUsers();
    const count = users.length;
    const total_pages = Math.ceil(count / page_size);
    const has_previous_page = page_number > 1;
    const has_next_page = page_number < total_pages;

    const start_index = (page_number - 1) * page_size;
    const end_index = Math.min(start_index + page_size, count);
    const users_on_page = users.slice(start_index, end_index);

    return {
      count,
      total_pages,
      has_previous_page,
      has_next_page,
      users: users_on_page,
    };
  } catch (error) {
    console.error('Error getting filtered users:', error);
    throw error;
  }
}

async function changeUserPassword(id, oldPassword, newPassword) {
  const user = await usersRepository.getUser(id);

  if (!user) {
    return null;
  }

  const isMatch = await comparePasswords(oldPassword, user.password);
  const hashedNewPassword = await hashPassword(newPassword);

  if (!isMatch) {
    return false;
  }

  try {
    await usersRepository.updatePassword(id, hashedNewPassword);
  } catch (err) {
    return null;
  }

  return true;
}

async function comparePasswords(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

async function emailIsRegistered(email) {
  try {
    const user = await usersRepository.getUserByEmail(email);
    return user !== null;
  } catch (error) {
    console.error('Error checking email registration:', error);
    throw error;
  }
}

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  isEmailTaken,
  changeUserPassword,
  getFilteredUsers,
  emailIsRegistered,
};
