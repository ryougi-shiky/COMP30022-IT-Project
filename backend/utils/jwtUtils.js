const jwt = require('jsonwebtoken');

const generateAccessToken = (userId, email) => {
  console.log(`[JWT] Generating access token for user: ${userId}, email: ${email}`);
  const token = jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '15m' }
  );
  console.log(`[JWT] Access token generated successfully for user: ${userId}`);
  return token;
};

const generateRefreshToken = (userId) => {
  console.log(`[JWT] Generating refresh token for user: ${userId}`);
  const token = jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
  );
  console.log(`[JWT] Refresh token generated successfully for user: ${userId}`);
  return token;
};

const verifyAccessToken = (token) => {
  try {
    console.log('[JWT] Verifying access token');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`[JWT] Access token verified successfully for user: ${decoded.userId}`);
    return decoded;
  } catch (error) {
    console.error(`[JWT] Access token verification failed: ${error.message}`);
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
    console.log('[JWT] Verifying refresh token');
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    console.log(`[JWT] Refresh token verified successfully for user: ${decoded.userId}`);
    return decoded;
  } catch (error) {
    console.error(`[JWT] Refresh token verification failed: ${error.message}`);
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
