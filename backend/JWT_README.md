# JWT Identity System

This implementation provides a secure JWT-based authentication system for the application.

## Features

✅ **JWT Access & Refresh Tokens** - Short-lived access tokens (15 minutes) with long-lived refresh tokens (7 days)  
✅ **Password Hashing** - Uses bcrypt with 10 salt rounds  
✅ **Rate Limiting** - Protects against brute force attacks  
✅ **Account Locking** - Locks accounts after 5 failed login attempts for 2 hours  
✅ **Multi-Device Sessions** - Supports up to 5 concurrent sessions per user  
✅ **Secure Logout** - Logout from single device or all devices  
✅ **Comprehensive Tests** - 46 tests with 82% coverage  

## Setup

### 1. Install Dependencies

Dependencies are already installed via npm:
- `jsonwebtoken` - JWT token generation and verification
- `express-rate-limit` - API rate limiting
- `nodemailer` - Email functionality (for future password reset features)

### 2. Configure Environment Variables

Copy the example configuration:
```bash
cp config.env.example config.env
```

Edit `config.env` and set secure values for:
- `JWT_SECRET` - At least 32 characters, use a random string
- `REFRESH_TOKEN_SECRET` - Different from JWT_SECRET, also 32+ characters

**Generate secure secrets:**
```bash
# On Linux/Mac:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use openssl:
openssl rand -hex 32
```

### 3. Run Tests

```bash
npm test
```

All 46 tests should pass with coverage report.

## API Endpoints

### POST /users/auth/register
Register a new user account.

**Request:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (201):**
```json
{
  "message": "Registration successful",
  "user": {
    "_id": "...",
    "username": "johndoe",
    "email": "john@example.com",
    "createdAt": "..."
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### POST /users/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": { "..." },
  "accessToken": "...",
  "refreshToken": "..."
}
```

**Error Responses:**
- `400` - Invalid credentials
- `404` - User not found
- `423` - Account locked (too many failed attempts)
- `429` - Too many requests (rate limited)

### POST /users/auth/refresh
Refresh an expired access token using a refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "accessToken": "new_access_token",
  "refreshToken": "new_refresh_token"
}
```

### POST /users/auth/logout
Logout from current device.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

### POST /users/auth/logout-all
Logout from all devices.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "message": "Logged out from all devices"
}
```

## Using Protected Routes

### Backend - Protect Routes with Middleware

```javascript
const { authenticateToken } = require('./middleware/authMiddleware');

// Require authentication
router.get('/profile', authenticateToken, (req, res) => {
  // req.user contains { userId, email } from the JWT
  res.json({ userId: req.user.userId });
});

// Optional authentication
const { optionalAuth } = require('./middleware/authMiddleware');
router.get('/posts', optionalAuth, (req, res) => {
  // req.user is defined if token provided, undefined otherwise
  if (req.user) {
    // Show personalized posts
  } else {
    // Show public posts
  }
});
```

### Frontend - Making Authenticated Requests

```javascript
// Store tokens after login
const { accessToken, refreshToken, user } = response.data;
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// Include token in requests
const response = await fetch('/users/profile', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});

// Handle token refresh on 401/403
if (response.status === 401 || response.status === 403) {
  const refreshResponse = await fetch('/users/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      refreshToken: localStorage.getItem('refreshToken') 
    })
  });
  
  if (refreshResponse.ok) {
    const { accessToken, refreshToken } = await refreshResponse.json();
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    // Retry original request
  } else {
    // Redirect to login
  }
}
```

## Security Features

### Password Requirements
- Minimum 8 characters
- Hashed using bcrypt with 10 rounds
- Never stored or returned in plain text

### Rate Limiting
- **Login:** 5 attempts per 15 minutes per IP
- **Registration:** 3 attempts per hour per IP

### Account Locking
- Automatically locks after 5 failed login attempts
- Lock duration: 2 hours
- Automatically unlocks after duration expires
- Login attempts counter resets on successful login

### Token Management
- Access tokens expire after 15 minutes
- Refresh tokens expire after 7 days
- Maximum 5 refresh tokens per user (enforced FIFO)
- Tokens are invalidated on logout

### Password Storage
- Passwords are never returned in API responses
- `toJSON()` method on User model automatically excludes sensitive fields
- Includes: password, refreshTokens, verificationToken, resetPasswordToken, twoFactorSecret

## Testing

The implementation includes comprehensive test coverage:

### JWT Utilities Tests (17 tests)
- Token generation and verification
- Token expiration handling
- Invalid token handling
- Token independence

### Auth Middleware Tests (10 tests)
- Required authentication
- Optional authentication
- Token validation
- Error handling

### Auth Routes Tests (19 tests)
- Registration flow
- Login flow with account locking
- Token refresh
- Logout (single and all devices)
- Input validation
- Error scenarios

**Run tests:**
```bash
npm test
```

**Run tests with coverage:**
```bash
npm test -- --coverage
```

## Architecture

```
backend/
├── utils/
│   └── jwtUtils.js              # JWT token generation and verification
├── middleware/
│   └── authMiddleware.js        # Authentication middleware
├── models/
│   └── User.js                  # User model with JWT fields
├── routes/
│   └── auth.js                  # Authentication routes
└── __tests__/
    ├── jwtUtils.test.js         # JWT utilities tests
    ├── authMiddleware.test.js   # Middleware tests
    └── auth.test.js             # Auth routes integration tests
```

## Future Enhancements

Potential additions based on the identity system documentation:

- [ ] Email verification
- [ ] Password reset flow
- [ ] Two-factor authentication (2FA)
- [ ] OAuth2 integration (Google, GitHub)
- [ ] Session management dashboard
- [ ] Security event logging
- [ ] IP-based security alerts

## Troubleshooting

### "Invalid or expired token"
- Access token has expired (15 min lifetime)
- Use the refresh token to get a new access token
- If refresh token also expired, user must login again

### "Account is locked"
- Too many failed login attempts (5+)
- Wait 2 hours for automatic unlock
- Or reset via database if needed

### "Refresh token required"
- Logout endpoints require a valid refresh token
- Check that token is being sent in request body

### Tests failing
- Ensure `NODE_ENV=test` is set (done automatically by jest)
- Check that all dependencies are installed
- Verify no conflicting MongoDB connections

## Documentation References

For more details, see:
- [Identity System Full Documentation](../../docs/identity-system/identity-system.md)
- [Implementation Guide](../../docs/identity-system/identity-system-implementation-guide.md)
- [Quick Reference](../../docs/identity-system/identity-system-quick-reference.md)

## Security Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` and `REFRESH_TOKEN_SECRET` to secure random values
- [ ] Enable HTTPS (TLS/SSL)
- [ ] Set secure CORS whitelist
- [ ] Configure secure cookie flags (httpOnly, secure, sameSite)
- [ ] Set up proper logging for security events
- [ ] Regular dependency updates and security audits
- [ ] Environment variables secured and not committed to git
- [ ] Database access restricted and secured
- [ ] Rate limiting configured appropriately for production load
