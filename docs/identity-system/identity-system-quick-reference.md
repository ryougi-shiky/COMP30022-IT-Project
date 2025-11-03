# Identity System Quick Reference

## 🎯 Purpose
Quick reference guide for developers working with the authentication system.

## 📋 Current System Summary

### Tech Stack
- **Backend**: Express.js + MongoDB + Mongoose
- **Password Hashing**: bcrypt (10 rounds)
- **Session**: Cookie + localStorage
- **State Management**: React Context API

### Key Files
```
backend/
├── routes/auth.js              # Registration & login endpoints
├── models/User.js              # User schema
└── server.js                   # Express setup with CORS

frontend/
├── src/context/
│   ├── AuthContext.js          # Global auth state
│   ├── AuthReducer.js          # State transitions
│   └── AuthActions.js          # Action creators
├── src/pages/login/Login.jsx   # Login page
└── src/pages/register/Register.jsx  # Registration page
```

## 🔐 Authentication Flow (Current)

```
1. User submits email + password
2. Frontend stores password in cookies (❌ SECURITY ISSUE)
3. Backend validates against hashed password in DB
4. Backend returns full user object including password hash (❌ SECURITY ISSUE)
5. Frontend stores user in localStorage
6. Frontend uses AuthContext to track logged-in state
```

## 🛡️ Security Issues

### Critical (Fix Immediately)
| Issue | Impact | Location |
|-------|--------|----------|
| Plain password in cookies | High | `frontend/src/pages/login/Login.jsx:31` |
| Password hash returned | High | `backend/routes/auth.js:62` |
| No rate limiting | High | `backend/routes/auth.js` |

### High Priority
| Issue | Impact | Recommendation |
|-------|--------|----------------|
| No session expiration | High | Implement JWT with expiration |
| No logout mechanism | Medium | Server-side logout endpoint |
| Weak authorization checks | High | Add proper middleware |

## 🚀 Quick Migration Checklist

### Phase 1: Critical Fixes (1-2 days)
```bash
- [ ] Remove password from login response
- [ ] Remove password from cookies
- [ ] Add rate limiting to auth endpoints
- [ ] Add LOGOUT action to AuthReducer
```

### Phase 2: JWT Implementation (3-5 days)
```bash
- [ ] npm install jsonwebtoken express-rate-limit
- [ ] Create backend/utils/jwtUtils.js
- [ ] Create backend/middleware/authMiddleware.js
- [ ] Update backend/routes/auth.js
- [ ] Update backend/models/User.js
- [ ] Create frontend/src/utils/axios.js
- [ ] Update frontend login/register components
- [ ] Update API calls to include Bearer token
```

### Phase 3: Testing (2-3 days)
```bash
- [ ] Unit tests for JWT utilities
- [ ] Integration tests for auth flow
- [ ] Update e2e tests
- [ ] Manual testing of all protected routes
```

## 📝 Code Snippets

### Generate JWT (Backend)
```javascript
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { userId: user._id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '15m' }
);
```

### Verify JWT (Backend)
```javascript
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json("Token required");
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json("Invalid token");
    req.user = user;
    next();
  });
};
```

### Make Authenticated Request (Frontend)
```javascript
import axios from 'axios';

const token = localStorage.getItem('accessToken');
const response = await axios.get('/users/profile', {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Axios Interceptor (Frontend)
```javascript
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 🔧 Environment Variables

Add to `backend/config.env`:
```env
# JWT Configuration
JWT_SECRET=your-super-secret-key-minimum-32-characters-long
REFRESH_TOKEN_SECRET=another-super-secret-key-for-refresh-tokens
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# CORS Configuration
CORS_WHITELIST=http://localhost:3000,http://localhost:17000

# MongoDB
MONGODB_URI=mongodb://db:27017
MONGODB_NAME=your_database_name
```

## 🧪 Testing Commands

```bash
# Test registration
curl -X POST http://localhost:17000/users/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'

# Test login
curl -X POST http://localhost:17000/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test protected route
curl -X GET http://localhost:17000/users/:id \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📊 Performance Metrics

| Metric | Current | With JWT | Notes |
|--------|---------|----------|-------|
| Login time | ~50ms | ~60ms | Minimal impact |
| Request overhead | 0 bytes | ~500 bytes | JWT in header |
| DB queries per request | 1 | 0 (for validation) | JWT is stateless |
| Memory per session | ~1KB | 0 | No server-side sessions |

## 🐛 Common Issues

### "Invalid or expired token"
**Cause**: Access token expired  
**Solution**: Implement token refresh in axios interceptor

### "CORS policy error"
**Cause**: Frontend URL not in whitelist  
**Solution**: Add URL to `CORS_WHITELIST` in config.env

### "Account is locked"
**Cause**: Too many failed login attempts  
**Solution**: Wait 2 hours or reset via admin

### "User already exists"
**Cause**: Duplicate username or email  
**Solution**: Use different credentials

## 📚 Additional Resources

### Documentation
- [Full Identity System Documentation](identity-system.md)
- [Step-by-Step Implementation Guide](identity-system-implementation-guide.md)
- [Current vs. Recommended Comparison](identity-system-comparison.md)

### External Resources
- [JWT.io - Introduction](https://jwt.io/introduction)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [bcrypt Documentation](https://www.npmjs.com/package/bcrypt)
- [Express Rate Limit](https://www.npmjs.com/package/express-rate-limit)

### Tools
- [JWT Debugger](https://jwt.io/#debugger) - Decode and verify JWT tokens
- [bcrypt Calculator](https://bcrypt-generator.com/) - Generate bcrypt hashes
- [Postman](https://www.postman.com/) - API testing

## 💡 Best Practices

### DO ✅
- ✅ Use async/await for all database operations
- ✅ Hash passwords with bcrypt (min 10 rounds)
- ✅ Validate input on both frontend and backend
- ✅ Use HTTPS in production
- ✅ Set httpOnly flags on cookies
- ✅ Implement rate limiting
- ✅ Log security events
- ✅ Use environment variables for secrets
- ✅ Sanitize user objects before sending to frontend
- ✅ Implement proper error handling

### DON'T ❌
- ❌ Store passwords in plain text
- ❌ Store passwords in cookies or localStorage
- ❌ Return password hashes to frontend
- ❌ Use synchronous bcrypt methods
- ❌ Trust user input without validation
- ❌ Commit secrets to git
- ❌ Use short JWT expiration times without refresh
- ❌ Allow unlimited login attempts
- ❌ Skip error handling
- ❌ Use weak secrets in production

## 🎓 Learning Path

### For New Developers
1. Read [Identity System Overview](identity-system.md)
2. Understand current authentication flow
3. Review security considerations
4. Try making authenticated API calls
5. Implement a simple protected route

### For Implementation
1. Review [Implementation Guide](identity-system-implementation-guide.md)
2. Set up development environment
3. Install required dependencies
4. Implement JWT utilities
5. Update auth routes
6. Update frontend
7. Test thoroughly
8. Deploy with monitoring

### For Security Audit
1. Review [Comparison Document](identity-system-comparison.md)
2. Identify vulnerabilities
3. Prioritize fixes
4. Implement security measures
5. Test security improvements
6. Document changes

## 📞 Support

### Questions?
- Check the documentation in `docs/` folder
- Review code comments in auth files
- Search existing issues on GitHub
- Ask in team chat

### Found a Bug?
1. Check if it's a known issue
2. Create minimal reproduction
3. Report with details
4. Include logs and error messages

### Contributing?
1. Read [CONTRIBUTING.md](../CONTRIBUTING.md)
2. Follow code style guidelines
3. Add tests for new features
4. Update documentation
5. Submit pull request

---

**Last Updated**: November 2024  
**Version**: 1.0  
**Maintainer**: Development Team
