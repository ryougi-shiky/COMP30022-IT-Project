const jwt = require('jsonwebtoken');

/**
 * Generates a short-lived access token for authenticated requests
 * @param {string} userId - The user's unique identifier
 * @param {string} email - The user's email address
 * @returns {string|null} JWT access token or null if parameters are invalid
 */
const generateAccessToken = (userId, email) => {
  // Validate required parameters
  if (!userId || !email) {
    return null;
  }

  const token = jwt.sign(
    { userId: String(userId), email: String(email) },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '15m' }
  );
  return token;
};

/**
 * Generates a long-lived refresh token for obtaining new access tokens
 * @param {string} userId - The user's unique identifier
 * @returns {string|null} JWT refresh token or null if userId is invalid
 */
const generateRefreshToken = (userId) => {
  // Validate required parameter
  if (!userId) {
    return null;
  }

  const token = jwt.sign(
    { userId: String(userId) },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
  );
  return token;
};

/**
 * Verifies and decodes an access token
 * @param {string} token - The JWT access token to verify
 * @returns {object|null} Decoded token payload or null if invalid/expired
 */
const verifyAccessToken = (token) => {
  // Validate token parameter
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Verifies and decodes a refresh token
 * @param {string} token - The JWT refresh token to verify
 * @returns {object|null} Decoded token payload or null if invalid/expired
 */
const verifyRefreshToken = (token) => {
  // Validate token parameter
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
