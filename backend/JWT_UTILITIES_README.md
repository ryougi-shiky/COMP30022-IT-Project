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
