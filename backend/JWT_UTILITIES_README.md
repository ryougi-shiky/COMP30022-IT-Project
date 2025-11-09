# JWT Utilities

This is the first PR in a series to implement JWT-based authentication.

## What's Included

This PR adds the foundational JWT token utilities:

- **`backend/utils/jwtUtils.js`** - Core JWT functions:
  - `generateAccessToken(userId, email)` - Creates short-lived access tokens (15 min)
  - `generateRefreshToken(userId)` - Creates long-lived refresh tokens (7 days)
  - `verifyAccessToken(token)` - Validates and decodes access tokens
  - `verifyRefreshToken(token)` - Validates and decodes refresh tokens

- **`backend/__tests__/jwtUtils.test.js`** - Comprehensive test suite:
  - 17 tests covering all JWT operations
  - Token generation and verification
  - Expiration handling
  - Invalid token handling
  - Token independence tests

- **Dependencies**:
  - Added `jsonwebtoken` for JWT operations
  - Added `jest` for testing

## Testing

```bash
cd backend
npm install
npm test
```

All 17 tests pass successfully.

## Environment Variables Required

The JWT utilities require these environment variables:
- `JWT_SECRET` - Secret key for access tokens (min 32 chars)
- `REFRESH_TOKEN_SECRET` - Secret key for refresh tokens (min 32 chars)
- `JWT_EXPIRY` - Access token expiry (default: 15m)
- `REFRESH_TOKEN_EXPIRY` - Refresh token expiry (default: 7d)

### Understanding JWT Secrets

**Important**: JWT does not generate secrets automatically. You must provide them yourself.

These secrets are cryptographic signing keys (similar to database passwords) used to:
- Sign tokens to prevent tampering
- Verify token authenticity
- Ensure only your application can issue valid tokens

Without proper secrets, anyone could forge valid tokens and compromise your authentication system.

### How to Generate Secure Secrets

You need to generate random, secret strings (minimum 32 characters for security):

**Using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Using OpenSSL:**
```bash
openssl rand -hex 32
```

**Example output:**
```
a7f3d9c2e8b4f1a6d5c9e7b3a2f8d4c1e6b9a5d7f2c8e4b1a9d6f3c7e2b5a8d4
```

Generate separate secrets for `JWT_SECRET` and `REFRESH_TOKEN_SECRET`, then store them securely in your environment configuration (never commit them to version control).

## Next Steps

Subsequent PRs will build on this foundation:
- PR2: Authentication middleware + tests
- PR3: User model updates
- PR4: Auth routes + rate limiting + tests
- PR5: Docker configuration + documentation

## Security

- Uses industry-standard JWT (RFC 7519)
- Separate secrets for access and refresh tokens
- Configurable token expiry times
- All functions have comprehensive test coverage
