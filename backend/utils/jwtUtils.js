const jwt = require('jsonwebtoken');

const generateAccessToken = (userId, email) => {
  const token = jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '15m' }
  );
  return token;
};

const generateRefreshToken = (userId) => {
  const token = jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
  );
  return token;
};

const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

const verifyRefreshToken = (token) => {
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
