const { authenticateToken, optionalAuth } = require('../middleware/authMiddleware');
const { generateAccessToken } = require('../utils/jwtUtils');

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-at-least-32-characters-long';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-key-at-least-32-characters-long';

describe('Authentication Middleware', () => {
  const testUserId = '507f1f77bcf86cd799439011';
  const testEmail = 'test@example.com';

  describe('authenticateToken', () => {
    it('should authenticate valid token', () => {
      const token = generateAccessToken(testUserId, testEmail);
      
      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = {};
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe(testUserId);
      expect(req.user.email).toBe(testEmail);
    });

    it('should reject request without token', () => {
      const req = {
        headers: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Access token required" });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid.token.here'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with malformed authorization header', () => {
      const req = {
        headers: {
          authorization: 'InvalidFormat'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Access token required" });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle expired token', (done) => {
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: testUserId, email: testEmail },
        process.env.JWT_SECRET,
        { expiresIn: '0s' }
      );

      setTimeout(() => {
        const req = {
          headers: {
            authorization: `Bearer ${expiredToken}`
          }
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        const next = jest.fn();

        authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
        expect(next).not.toHaveBeenCalled();
        done();
      }, 100);
    });
  });

  describe('optionalAuth', () => {
    it('should attach user if valid token provided', () => {
      const token = generateAccessToken(testUserId, testEmail);
      
      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = {};
      const next = jest.fn();

      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe(testUserId);
      expect(req.user.email).toBe(testEmail);
    });

    it('should continue without user if no token provided', () => {
      const req = {
        headers: {}
      };
      const res = {};
      const next = jest.fn();

      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    it('should continue without user if invalid token provided', () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid.token.here'
        }
      };
      const res = {};
      const next = jest.fn();

      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    it('should handle malformed authorization header gracefully', () => {
      const req = {
        headers: {
          authorization: 'InvalidFormat'
        }
      };
      const res = {};
      const next = jest.fn();

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
        const req = {
          headers: {
            authorization: `Bearer ${expiredToken}`
          }
        };
        const res = {};
        const next = jest.fn();

        optionalAuth(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toBeUndefined();
        done();
      }, 100);
    });
  });
});
