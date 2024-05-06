const { errorResponder, errorTypes } = require('../../../core/errors');
const authenticationServices = require('./authentication-service');

// Objek untuk menyimpan informasi tentang pengguna dan jumlah kesalahan login
const userLoginAttempts = {};

/**
 * Handle login request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function login(request, response, next) {
  const { email, password } = request.body;

  try {
    // Check apakah email telah melebihi batas percobaan login
    if (
      userLoginAttempts.hasOwnProperty(email) &&
      userLoginAttempts[email].attempts >= 5
    ) {
      const elapsedTime = Date.now() - userLoginAttempts[email].lastAttempt;
      // Cek apakah sudah lebih dari 30 menit sejak percobaan login terakhir
      if (elapsedTime < 30 * 60 * 1000) {
        throw errorResponder(
          errorTypes.TOO_MANY_ATTEMPTS,
          '403 Forbidden: Too many failed login attempts, try again in 30 minutes'
        );
      } else {
        // Reset counter percobaan login
        userLoginAttempts[email].attempts = 0;
      }
    }

    // Check login credentials
    const loginSuccess = await authenticationServices.checkLoginCredentials(
      email,
      password
    );

    if (!loginSuccess) {
      // Tambahkan percobaan login ke dalam log
      if (!userLoginAttempts.hasOwnProperty(email)) {
        userLoginAttempts[email] = {
          attempts: 1,
          lastAttempt: Date.now(),
        };
      } else {
        userLoginAttempts[email].attempts++;
        userLoginAttempts[email].lastAttempt = Date.now();
      }
      throw errorResponder(
        errorTypes.INVALID_CREDENTIALS,
        'Wrong email or password'
      );
    }

    // Reset counter percobaan login jika berhasil login
    if (userLoginAttempts.hasOwnProperty(email)) {
      delete userLoginAttempts[email];
    }

    return response.status(200).json(loginSuccess);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  login,
};
