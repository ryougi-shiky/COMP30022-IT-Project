const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const { 
  generateAccessToken, 
  generateRefreshToken,
  verifyRefreshToken 
} = require('../utils/jwtUtils');

// Rate limiter for login attempts (skip in test environment)
const loginLimiter = process.env.NODE_ENV === 'test' 
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window
      message: { 
        message: "Too many login attempts. Please try again later." 
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

// Rate limiter for registration (skip in test environment)
const registerLimiter = process.env.NODE_ENV === 'test'
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 registrations per hour per IP
      message: { 
        message: "Too many accounts created. Please try again later." 
      }
    });

// register
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ 
        message: "All fields are required" 
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
      return res.status(400).json({ type: "unameDupErr", message: "Username already taken. Please try another one." });
    }

    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      return res.status(400).json({ type: "emailDupErr", message: "Email already taken. Please try another one." });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPwd = await bcrypt.hash(password, salt);

    // create user instance
    const newUser = new User({
      username,
      email,
      password: hashedPwd,
    });

    // store it in database
    const user = await newUser.save();
    
    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.email);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token
    user.refreshTokens = [refreshToken];
    await user.save();

    // Return response without password
    res.status(201).json({
      message: "Registration successful",
      user: user.toJSON(),
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

router.post('/login', loginLimiter, async (req, res) => {
  console.log("login req.body: ", req.body);
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        message: "Email and password are required" 
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

    // Return response
    res.status(200).json({
      message: "Login successful",
      user: user.toJSON(),
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
router.post('/refresh', async (req, res) => {
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
router.post('/logout', async (req, res) => {
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
router.post('/logout-all', async (req, res) => {
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