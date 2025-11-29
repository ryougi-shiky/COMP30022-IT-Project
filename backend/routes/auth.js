const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const { 
  generateAccessToken, 
  generateRefreshToken,
  verifyRefreshToken 
} = require('../utils/jwtUtils');

// Check if running in development/test mode
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

// Email validation regex (RFC 5322 compliant basic pattern)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if email format is valid
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return EMAIL_REGEX.test(email.trim());
};

// Rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 100 : 5, // Higher limit in development for E2E tests
  message: { 
    message: "Too many login attempts. Please try again later." 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for registration
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDevelopment ? 100 : 3, // Higher limit in development for E2E tests
  message: { 
    message: "Too many accounts created. Please try again later." 
  }
});

// Rate limiter for token refresh
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 refresh attempts per window
  message: { 
    message: "Too many token refresh requests. Please try again later." 
  }
});

// Rate limiter for logout operations
const logoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 logout attempts per window
  message: { 
    message: "Too many logout requests. Please try again later." 
  }
});

// Register
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ 
        message: "All fields are required" 
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        message: "Please provide a valid email address" 
      });
    }

    // Check password strength
    if (password.length < 8) {
      return res.status(400).json({ 
        message: "Password must be at least 8 characters long" 
      });
    }

    // Check if username exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ 
        type: "unameDupErr", 
        message: "Username already taken. Please try another one." 
      });
    }

    // Check if email exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ 
        type: "emailDupErr", 
        message: "Email already taken. Please try another one." 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPwd = await bcrypt.hash(password, salt);

    // Create user instance
    const newUser = new User({
      username,
      email,
      password: hashedPwd,
    });

    // Save to database first
    const user = await newUser.save();
    
    // Generate tokens with saved user's ID
    const accessToken = generateAccessToken(user._id, user.email);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token
    user.refreshTokens = [refreshToken];
    await user.save();

    // Return response - spread user properties at top level for backward compatibility
    // while also including tokens for JWT-based authentication
    res.status(201).json({
      ...user.toJSON(),
      accessToken,
      refreshToken
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      message: "Registration failed. Please try again." 
    });
  }
});

// Login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        message: "Email and password are required" 
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        message: "Please provide a valid email address" 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        message: "Invalid email or password" 
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(423).json({ 
        message: "Account is locked due to too many failed login attempts. Please try again later." 
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      // Increment login attempts
      await user.incLoginAttempts();
      
      return res.status(400).json({ 
        message: "Invalid email or password" 
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.email);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token
    if (!user.refreshTokens) {
      user.refreshTokens = [];
    }
    user.refreshTokens.push(refreshToken);
    
    // Keep only last 5 refresh tokens
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }
    
    await user.save();

    // Return response - spread user properties at top level for backward compatibility
    // while also including tokens for JWT-based authentication
    res.status(200).json({
      ...user.toJSON(),
      accessToken,
      refreshToken
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      message: "Login failed. Please try again." 
    });
  }
});

// Refresh token
router.post('/refresh', refreshLimiter, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ 
        message: "Refresh token required" 
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(403).json({ 
        message: "Invalid or expired refresh token" 
      });
    }

    // Find user and verify refresh token is in database
    const user = await User.findById(decoded.userId);
    if (!user || !user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
      return res.status(403).json({ 
        message: "Invalid refresh token" 
      });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user._id, user.email);
    const newRefreshToken = generateRefreshToken(user._id);

    // Replace old refresh token with new one
    user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    console.error('Token refresh error:', err);
    res.status(500).json({ 
      message: "Token refresh failed" 
    });
  }
});

// Logout
router.post('/logout', logoutLimiter, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(200).json({ 
        message: "Logout successful" 
      });
    }

    // Verify and decode token
    const decoded = verifyRefreshToken(refreshToken);
    if (decoded) {
      // Remove refresh token from database
      const user = await User.findById(decoded.userId);
      if (user && user.refreshTokens) {
        user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
        await user.save();
      }
    }

    res.status(200).json({ 
      message: "Logout successful" 
    });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ 
      message: "Logout failed" 
    });
  }
});

// Logout from all devices
router.post('/logout-all', logoutLimiter, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        message: "Refresh token required" 
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(403).json({ 
        message: "Invalid token" 
      });
    }

    // Clear all refresh tokens
    const user = await User.findById(decoded.userId);
    if (user) {
      user.refreshTokens = [];
      await user.save();
    }

    res.status(200).json({ 
      message: "Logged out from all devices" 
    });
  } catch (err) {
    console.error('Logout all error:', err);
    res.status(500).json({ 
      message: "Logout failed" 
    });
  }
});

module.exports = router;