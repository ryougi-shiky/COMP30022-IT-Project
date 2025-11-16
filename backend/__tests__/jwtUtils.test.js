const jwt = require('jsonwebtoken');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
} = require('../utils/jwtUtils');

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-at-least-32-characters-long';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-key-at-least-32-characters-long';
process.env.JWT_EXPIRY = '15m';
process.env.REFRESH_TOKEN_EXPIRY = '7d';

describe('JWT Utils', () => {
  const testUserId = '507f1f77bcf86cd799439011';
  const testEmail = 'test@example.com';
  
  let consoleLogSpy;
  let consoleErrorSpy;
  
  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });
  
  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(testUserId, testEmail);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Verify the token can be decoded
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.email).toBe(testEmail);
    });
    
    it('should log token generation', () => {
      generateAccessToken(testUserId, testEmail);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Generated access token for user:')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(testUserId)
      );
    });

    it('should generate token with correct expiry', () => {
      const token = generateAccessToken(testUserId, testEmail);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Token should expire in approximately 15 minutes (900 seconds)
      const expiryTime = decoded.exp - decoded.iat;
      expect(expiryTime).toBe(900);
    });

    it('should include userId and email in payload', () => {
      const token = generateAccessToken(testUserId, testEmail);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.email).toBe(testEmail);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(testUserId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Verify the token can be decoded
      const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
      expect(decoded.userId).toBe(testUserId);
    });
    
    it('should log token generation', () => {
      generateRefreshToken(testUserId);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Generated refresh token for user:')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(testUserId)
      );
    });

    it('should generate token with correct expiry (7 days)', () => {
      const token = generateRefreshToken(testUserId);
      const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
      
      // Token should expire in approximately 7 days (604800 seconds)
      const expiryTime = decoded.exp - decoded.iat;
      expect(expiryTime).toBe(604800);
    });

    it('should only include userId in payload', () => {
      const token = generateRefreshToken(testUserId);
      const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
      
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.email).toBeUndefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = generateAccessToken(testUserId, testEmail);
      const decoded = verifyAccessToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.email).toBe(testEmail);
    });

    it('should return null for invalid token', () => {
      const decoded = verifyAccessToken('invalid.token.here');
      expect(decoded).toBeNull();
    });

    it('should return null for expired token', () => {
      // Create a token that expires immediately
      const expiredToken = jwt.sign(
        { userId: testUserId, email: testEmail },
        process.env.JWT_SECRET,
        { expiresIn: '0s' }
      );
      
      // Wait a moment to ensure expiry
      return new Promise(resolve => setTimeout(resolve, 100)).then(() => {
        const decoded = verifyAccessToken(expiredToken);
        expect(decoded).toBeNull();
      });
    });

    it('should return null for token with wrong secret', () => {
      const token = jwt.sign(
        { userId: testUserId, email: testEmail },
        'wrong-secret',
        { expiresIn: '15m' }
      );
      
      const decoded = verifyAccessToken(token);
      expect(decoded).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken(testUserId);
      const decoded = verifyRefreshToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(testUserId);
    });

    it('should return null for invalid token', () => {
      const decoded = verifyRefreshToken('invalid.token.here');
      expect(decoded).toBeNull();
    });

    it('should return null for expired token', () => {
      // Create a token that expires immediately
      const expiredToken = jwt.sign(
        { userId: testUserId },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '0s' }
      );
      
      // Wait a moment to ensure expiry
      return new Promise(resolve => setTimeout(resolve, 100)).then(() => {
        const decoded = verifyRefreshToken(expiredToken);
        expect(decoded).toBeNull();
      });
    });

    it('should return null for token with wrong secret', () => {
      const token = jwt.sign(
        { userId: testUserId },
        'wrong-secret',
        { expiresIn: '7d' }
      );
      
      const decoded = verifyRefreshToken(token);
      expect(decoded).toBeNull();
    });

    it('should not verify access token as refresh token', () => {
      const accessToken = generateAccessToken(testUserId, testEmail);
      const decoded = verifyRefreshToken(accessToken);
      
      // Should return null because it was signed with JWT_SECRET, not REFRESH_TOKEN_SECRET
      expect(decoded).toBeNull();
    });
  });

  describe('Token independence', () => {
    it('should generate different tokens for same user at different times', async () => {
      const token1 = generateAccessToken(testUserId, testEmail);
      
      // Wait a moment to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const token2 = generateAccessToken(testUserId, testEmail);
      
      expect(token1).not.toBe(token2);
    });

    it('access and refresh tokens should be different', () => {
      const accessToken = generateAccessToken(testUserId, testEmail);
      const refreshToken = generateRefreshToken(testUserId);
      
      expect(accessToken).not.toBe(refreshToken);
    });
  });
});
