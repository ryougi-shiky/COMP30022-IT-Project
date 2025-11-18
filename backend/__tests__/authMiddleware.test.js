const { authenticateToken, optionalAuth } = require('../middleware/authMiddleware');
const { generateAccessToken } = require('../utils/jwtUtils');

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-at-least-32-characters-long';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-key-at-least-32-characters-long';
process.env.JWT_EXPIRY = '15m';
process.env.REFRESH_TOKEN_EXPIRY = '7d';

describe('Authentication Middleware', () => {
  const testUserId = '507f1f77bcf86cd799439011';
  const testEmail = 'test@example.com';
  
  let req;
  let res;
  let next;
  
  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('authenticateToken', () => {
    it('should return 401 if no authorization header is provided', () => {
      authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Access token required"
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header is empty', () => {
      req.headers['authorization'] = '';
      
      authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Access token required"
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if authorization header does not contain Bearer token', () => {
      req.headers['authorization'] = 'Basic sometoken';
      
      authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid or expired token"
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if token is invalid', () => {
      req.headers['authorization'] = 'Bearer invalid.token.here';
      
      authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid or expired token"
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if token is malformed', () => {
      req.headers['authorization'] = 'Bearer malformedtoken';
      
      authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid or expired token"
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next() and set req.user if token is valid', () => {
      const token = generateAccessToken(testUserId, testEmail);
      req.headers['authorization'] = `Bearer ${token}`;
      
      authenticateToken(req, res, next);
      
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe(testUserId);
      expect(req.user.email).toBe(testEmail);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should extract token correctly from Bearer format', () => {
      const token = generateAccessToken(testUserId, testEmail);
      req.headers['authorization'] = `Bearer ${token}`;
      
      authenticateToken(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.user.userId).toBe(testUserId);
    });

    it('should handle authorization header with extra spaces', () => {
      const token = generateAccessToken(testUserId, testEmail);
      req.headers['authorization'] = `Bearer  ${token}`;
      
      authenticateToken(req, res, next);
      
      // Should fail with 401 because split(' ')[1] returns empty string
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should set req.user with all token payload properties', () => {
      const token = generateAccessToken(testUserId, testEmail);
      req.headers['authorization'] = `Bearer ${token}`;
      
      authenticateToken(req, res, next);
      
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe(testUserId);
      expect(req.user.email).toBe(testEmail);
      expect(req.user.iat).toBeDefined();
      expect(req.user.exp).toBeDefined();
    });

    it('should return 403 for expired token', (done) => {
      // Create an expired token
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: testUserId, email: testEmail },
        process.env.JWT_SECRET,
        { expiresIn: '0s' }
      );
      
      setTimeout(() => {
        req.headers['authorization'] = `Bearer ${expiredToken}`;
        
        authenticateToken(req, res, next);
        
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          message: "Invalid or expired token"
        });
        expect(next).not.toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should not modify req if token is invalid', () => {
      req.headers['authorization'] = 'Bearer invalid.token.here';
      
      authenticateToken(req, res, next);
      
      expect(req.user).toBeUndefined();
    });
  });

  describe('optionalAuth', () => {
    it('should call next() if no authorization header is provided', () => {
      optionalAuth(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should call next() if authorization header is empty', () => {
      req.headers['authorization'] = '';
      
      optionalAuth(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    it('should call next() without setting req.user if token is invalid', () => {
      req.headers['authorization'] = 'Bearer invalid.token.here';
      
      optionalAuth(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should set req.user and call next() if token is valid', () => {
      const token = generateAccessToken(testUserId, testEmail);
      req.headers['authorization'] = `Bearer ${token}`;
      
      optionalAuth(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe(testUserId);
      expect(req.user.email).toBe(testEmail);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should call next() even if token verification fails', () => {
      req.headers['authorization'] = 'Bearer malformed-token';
      
      optionalAuth(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    it('should handle expired token gracefully', (done) => {
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: testUserId, email: testEmail },
        process.env.JWT_SECRET,
        { expiresIn: '0s' }
      );
      
      setTimeout(() => {
        req.headers['authorization'] = `Bearer ${expiredToken}`;
        
        optionalAuth(req, res, next);
        
        expect(next).toHaveBeenCalled();
        expect(req.user).toBeUndefined();
        done();
      }, 100);
    });

    it('should extract token correctly from Bearer format', () => {
      const token = generateAccessToken(testUserId, testEmail);
      req.headers['authorization'] = `Bearer ${token}`;
      
      optionalAuth(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.user.userId).toBe(testUserId);
    });

    it('should not throw error if authorization header format is incorrect', () => {
      req.headers['authorization'] = 'NotBearerFormat';
      
      expect(() => {
        optionalAuth(req, res, next);
      }).not.toThrow();
      
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Integration scenarios', () => {
    it('authenticateToken should reject what optionalAuth accepts gracefully', () => {
      req.headers['authorization'] = 'Bearer invalid.token';
      
      // optionalAuth should not reject
      optionalAuth(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
      
      // Reset mocks
      next.mockClear();
      res.status.mockClear();
      res.json.mockClear();
      
      // authenticateToken should reject
      authenticateToken(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('both middlewares should accept valid tokens identically', () => {
      const token = generateAccessToken(testUserId, testEmail);
      req.headers['authorization'] = `Bearer ${token}`;
      
      // Test with authenticateToken
      authenticateToken(req, res, next);
      const authUser = { ...req.user };
      
      // Reset
      req.user = undefined;
      next.mockClear();
      
      // Test with optionalAuth
      optionalAuth(req, res, next);
      const optionalUser = req.user;
      
      // Both should set the same user data
      expect(authUser.userId).toBe(optionalUser.userId);
      expect(authUser.email).toBe(optionalUser.email);
    });
  });
});
