# Identity System Implementation Guide

## Quick Start: JWT Authentication Implementation

This guide provides step-by-step instructions for implementing JWT-based authentication to replace the current session-based approach.

## Step 1: Install Dependencies

```bash
cd backend
npm install jsonwebtoken express-rate-limit nodemailer
```

## Step 2: Update Environment Variables

Add to `backend/config.env`:
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
REFRESH_TOKEN_SECRET=your-refresh-token-secret-also-change-this-min-32-chars
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Email configuration (for password reset and verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
FRONTEND_URL=http://localhost:3000
```

## Step 3: Create JWT Utilities

Create `backend/utils/jwtUtils.js`:
```javascript
const jwt = require('jsonwebtoken');

const generateAccessToken = (userId, email) => {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '15m' }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
  );
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
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
```

## Step 4: Create Authentication Middleware

Create `backend/middleware/authMiddleware.js`:
```javascript
const { verifyAccessToken } = require('../utils/jwtUtils');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      message: "Access token required" 
    });
  }

  const decoded = verifyAccessToken(token);
  
  if (!decoded) {
    return res.status(403).json({ 
      message: "Invalid or expired token" 
    });
  }

  req.user = decoded;
  next();
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decoded = verifyAccessToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth
};
```

## Step 5: Update User Model

Update `backend/models/User.js`:
```javascript
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    min: 2,
    max: 20,
    unique: true
  },
  email: {
    type: String,
    required: true,
    max: 50,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    min: 8,
    max: 100, // Increased to accommodate hashed passwords
  },
  profilePicture: {
    type: Buffer,
    default: null,
  },
  followers: {
    type: Array,
    default: []
  },
  followings: {
    type: Array,
    default: []
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  desc: {
    type: String,
    max: 50
  },
  age: {
    type: Number,
    min: 0,
    max: 200
  },
  from: {
    type: String,
    max: 20
  },
  // New fields for enhanced security
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpiry: Date,
  resetPasswordToken: String,
  resetPasswordExpiry: Date,
  refreshTokens: [String], // Store valid refresh tokens
  twoFactorSecret: String,
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
},
{ timestamps: true });

// Method to check if account is locked
UserSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to increment login attempts
UserSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  // Otherwise increment
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours
  
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// Don't return password in JSON
UserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verificationToken;
  delete obj.resetPasswordToken;
  delete obj.refreshTokens;
  delete obj.twoFactorSecret;
  return obj;
};

module.exports = mongoose.model("User", UserSchema);
```

## Step 6: Update Auth Routes

Update `backend/routes/auth.js`:
```javascript
const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const { 
  generateAccessToken, 
  generateRefreshToken,
  verifyRefreshToken 
} = require('../utils/jwtUtils');

// Rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { 
    message: "Too many login attempts. Please try again later." 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for registration
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: { 
    message: "Too many accounts created. Please try again later." 
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

    // Save to database
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
```

## Step 7: Protect Existing Routes

Update routes to use authentication middleware. Example for `backend/routes/user.js`:

```javascript
const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const { authenticateToken } = require('../middleware/authMiddleware');

// Update user - now requires authentication
router.put('/:id', authenticateToken, async (req, res) => {
  // Verify user can only update their own account or is admin
  if (req.user.userId !== req.params.id && !req.user.isAdmin) {
    return res.status(403).json({ 
      message: "You can only update your own account" 
    });
  }

  // If updating password, hash it
  if (req.body.password) {
    try {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    } catch (err) {
      return res.status(500).json(err);
    }
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { $set: req.body },
      { new: true }
    );
    
    res.status(200).json(user.toJSON());
  } catch (err) {
    res.status(500).json(err);
  }
});

// Delete user - requires authentication
router.delete('/:id', authenticateToken, async (req, res) => {
  if (req.user.userId !== req.params.id && !req.user.isAdmin) {
    return res.status(403).json({ 
      message: "You can only delete your own account" 
    });
  }

  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get user - public route
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user.toJSON());
  } catch (err) {
    res.status(500).json(err);
  }
});

// Follow user - requires authentication
router.put('/:id/follow', authenticateToken, async (req, res) => {
  if (req.user.userId === req.params.id) {
    return res.status(400).json({ message: "You cannot follow yourself" });
  }

  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.userId);

    if (!userToFollow.followers.includes(req.user.userId)) {
      await userToFollow.updateOne({ $push: { followers: req.user.userId } });
      await currentUser.updateOne({ $push: { followings: req.params.id } });
      res.status(200).json({ message: "User followed successfully" });
    } else {
      res.status(400).json({ message: "You already follow this user" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// Unfollow user - requires authentication
router.put('/:id/unfollow', authenticateToken, async (req, res) => {
  if (req.user.userId === req.params.id) {
    return res.status(400).json({ message: "You cannot unfollow yourself" });
  }

  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.userId);

    if (userToUnfollow.followers.includes(req.user.userId)) {
      await userToUnfollow.updateOne({ $pull: { followers: req.user.userId } });
      await currentUser.updateOne({ $pull: { followings: req.params.id } });
      res.status(200).json({ message: "User unfollowed successfully" });
    } else {
      res.status(400).json({ message: "You don't follow this user" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
```

## Step 8: Update Frontend

### Update API Configuration

Create `frontend/src/utils/axios.js`:
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:17000',
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 or 403 and we haven't retried yet
    if ((error.response?.status === 401 || error.response?.status === 403) 
        && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // No refresh token, redirect to login
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Try to refresh token
        const response = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/users/auth/refresh`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        // Store new tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### Update Login Component

Update `frontend/src/pages/login/Login.jsx`:
```javascript
import React, { useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { CircularProgress } from '@mui/material';
import api from '../../utils/axios';
import "./login.css";

export default function Login() {
  const email = useRef();
  const password = useRef();
  const { dispatch } = useContext(AuthContext);
  const [isFetching, setIsFetching] = React.useState(false);
  const [error, setError] = React.useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsFetching(true);
    setError(null);

    try {
      const response = await api.post('/users/auth/login', {
        email: email.current.value,
        password: password.current.value
      });

      const { user, accessToken, refreshToken } = response.data;

      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      // Update context
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });

      // Redirect to home
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      dispatch({ type: 'LOGIN_FAIL', payload: err.response?.data?.message });
    } finally {
      setIsFetching(false);
    }
  };

  const redirectToRegister = () => {
    navigate('/register');
  };

  return (
    <div className="login">
      <div className="loginWrapper">
        <div className="loginLeft">
          <h3 className="loginLogo">Ani Ani Login</h3>
          <span className="loginDesc">
            Connect with another Ani friends here ^&^
          </span>
        </div>
        <div className="loginRight">
          <form className="loginBox" onSubmit={handleLogin}>
            <input 
              placeholder='Email' 
              required 
              type="email" 
              className="loginInput" 
              ref={email} 
            />
            <input 
              placeholder='Password' 
              required 
              type="password" 
              className="loginInput" 
              ref={password} 
              minLength="8" 
            />
            {error && <div className="loginError">{error}</div>}
            <button 
              className="loginButton" 
              type='submit' 
              data-testid="login-button" 
              disabled={isFetching}
            >
              {isFetching ? (
                <CircularProgress color='inherit' size='20px' />
              ) : (
                "Log In"
              )}
            </button>
            <span className="loginForgot">Forgot Password?</span>
            <button 
              className="loginRegisterButton" 
              data-testid="register-button" 
              onClick={redirectToRegister}
              type="button"
            >
              Register
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

### Update Register Component

Similar updates for `frontend/src/pages/register/Register.jsx`:
```javascript
// Use api from utils/axios instead of direct axios
import api from '../../utils/axios';

// In the registration handler:
const response = await api.post('/users/auth/register', {
  username: username.current.value,
  email: email.current.value,
  password: password.current.value
});

const { user, accessToken, refreshToken } = response.data;

// Store tokens
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
localStorage.setItem('user', JSON.stringify(user));

// Update context
dispatch({ type: 'LOGIN_SUCCESS', payload: user });
```

### Add Logout Functionality

Create `frontend/src/components/Logout.jsx`:
```javascript
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';

export const useLogout = () => {
  const { dispatch } = useContext(AuthContext);
  const navigate = useNavigate();

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        // Notify backend
        await api.post('/users/auth/logout', { refreshToken });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      // Reset context
      dispatch({ type: 'LOGOUT' });

      // Redirect to login
      navigate('/login');
    }
  };

  return logout;
};
```

## Step 9: Testing

### Test Registration
```bash
curl -X POST http://localhost:17000/users/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:17000/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

### Test Protected Route
```bash
# Replace YOUR_ACCESS_TOKEN with the token from login response
curl -X GET http://localhost:17000/users/USER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Test Token Refresh
```bash
curl -X POST http://localhost:17000/users/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### Test Logout
```bash
curl -X POST http://localhost:17000/users/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## Step 10: Update Documentation

Add to `README.md`:

```markdown
## Authentication

The application uses JWT (JSON Web Token) based authentication.

### Tokens
- **Access Token**: Short-lived token (15 minutes) for API requests
- **Refresh Token**: Long-lived token (7 days) to obtain new access tokens

### API Endpoints
- `POST /users/auth/register` - Create new account
- `POST /users/auth/login` - Login and receive tokens
- `POST /users/auth/refresh` - Refresh access token
- `POST /users/auth/logout` - Logout from current device
- `POST /users/auth/logout-all` - Logout from all devices

### Protected Routes
All routes except registration and login require authentication via Bearer token:

```
Authorization: Bearer <access_token>
```

The frontend automatically handles token refresh when access tokens expire.
```

## Common Issues and Solutions

### Issue: "Invalid or expired token"
**Solution**: The access token has expired. The frontend should automatically refresh it. If the issue persists, login again.

### Issue: "Account is locked"
**Solution**: Too many failed login attempts. Wait 2 hours or contact administrator.

### Issue: "CORS error"
**Solution**: Ensure `CORS_WHITELIST` in environment includes your frontend URL.

### Issue: "JWT_SECRET not defined"
**Solution**: Add `JWT_SECRET` to your `config.env` file.

## Security Checklist

- [ ] Change JWT_SECRET in production
- [ ] Change REFRESH_TOKEN_SECRET in production
- [ ] Enable HTTPS in production
- [ ] Set secure cookie flags in production
- [ ] Configure proper CORS whitelist
- [ ] Set up rate limiting
- [ ] Implement logging for security events
- [ ] Regular security audits
- [ ] Keep dependencies updated

## Next Steps

1. Implement password reset functionality
2. Add email verification
3. Implement 2FA (optional)
4. Add session management dashboard
5. Implement OAuth2 (Google, GitHub, etc.)

## References

- [JWT.io](https://jwt.io/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
