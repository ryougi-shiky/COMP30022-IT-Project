const jwt = require('jsonwebtoken');

/**
 * Validates if a value is a non-empty string
 * @param {*} value - Value to validate
 * @returns {boolean} True if value is a non-empty string
 */
const isNonEmptyString = (value) => {
  return typeof value === 'string' && value.length > 0;
};

/**
 * Validates if a token input is valid for verification
 * @param {*} token - Token to validate
 * @returns {boolean} True if token is valid for verification
 */
const isValidTokenInput = (token) => {
  return token && typeof token === 'string' && token.length > 0;
};

/**
 * Generates a short-lived access token for authenticated requests
 * @param {string} userId - The user's unique identifier
 * @param {string} email - The user's email address
 * @returns {string|null} JWT access token or null if parameters are invalid
 */
const generateAccessToken = (userId, email) => {
  // Validate required parameters - userId can be string or ObjectId, email must be string
  if (!userId || !email || typeof email !== 'string') {
    return null;
  }

  const token = jwt.sign(
    { userId: String(userId), email },
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
  if (!isValidTokenInput(token)) {
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
  if (!isValidTokenInput(token)) {
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
