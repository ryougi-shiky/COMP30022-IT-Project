const User = require('../models/User');

describe('User Model', () => {
  const validUserData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword123'
  };

  describe('Schema Validation', () => {
    it('should create a user with valid data', async () => {
      const user = new User(validUserData);
      
      expect(user.username).toBe(validUserData.username);
      expect(user.email).toBe(validUserData.email);
      expect(user.password).toBe(validUserData.password);
    });

    it('should have default values for security fields', () => {
      const user = new User(validUserData);
      
      expect(user.emailVerified).toBe(false);
      expect(user.twoFactorEnabled).toBe(false);
      expect(user.loginAttempts).toBe(0);
      expect(user.isAdmin).toBe(false);
      expect(user.followers).toEqual([]);
      expect(user.followings).toEqual([]);
    });

    it('should require username', () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123'
      });
      
      const validationError = user.validateSync();
      expect(validationError.errors.username).toBeDefined();
    });

    it('should require email', () => {
      const user = new User({
        username: 'testuser',
        password: 'password123'
      });
      
      const validationError = user.validateSync();
      expect(validationError.errors.email).toBeDefined();
    });

    it('should require password', () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com'
      });
      
      const validationError = user.validateSync();
      expect(validationError.errors.password).toBeDefined();
    });

    it('should enforce minimum username length', () => {
      const user = new User({
        username: 'a', // Too short (min is 2)
        email: 'test@example.com',
        password: 'password123'
      });
      
      const validationError = user.validateSync();
      // Mongoose min/max on String validates length
      // A username of 1 character is less than min: 2
      expect(validationError).toBeDefined();
      expect(validationError.errors.username).toBeDefined();
    });

    it('should enforce maximum username length', () => {
      const user = new User({
        username: 'a'.repeat(31), // Too long (max is 30)
        email: 'test@example.com',
        password: 'password123'
      });
      
      const validationError = user.validateSync();
      // A username of 31 characters exceeds maxlength: 30
      expect(validationError).toBeDefined();
      expect(validationError.errors.username).toBeDefined();
    });

    it('should accept short passwords in model (validation happens in route)', () => {
      // Model accepts any length password since validation is in the route
      // This is because we store hashed passwords (always 60 chars)
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'short' // 5 characters - model doesn't validate plain text length
      });
      
      const validationError = user.validateSync();
      expect(validationError).toBeUndefined();
    });

    it('should enforce maximum password length', () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'a'.repeat(61) // More than maxlength: 60 characters (bcrypt hash length)
      });
      
      const validationError = user.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.password).toBeDefined();
    });

    it('should accept password with exactly 60 characters', () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'a'.repeat(60)
      });
      
      const validationError = user.validateSync();
      expect(validationError).toBeUndefined();
    });

    it('should have timestamps after creation', () => {
      const user = new User(validUserData);
      
      // Timestamps are only set after save, but schema should have timestamps enabled
      expect(user.schema.options.timestamps).toBe(true);
    });
  });

  describe('Security Fields', () => {
    it('should allow setting emailVerified', () => {
      const user = new User({
        ...validUserData,
        emailVerified: true
      });
      
      expect(user.emailVerified).toBe(true);
    });

    it('should allow setting verificationToken', () => {
      const token = 'verification-token-123';
      const user = new User({
        ...validUserData,
        verificationToken: token
      });
      
      expect(user.verificationToken).toBe(token);
    });

    it('should allow setting verificationTokenExpiry', () => {
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const user = new User({
        ...validUserData,
        verificationTokenExpiry: expiry
      });
      
      expect(user.verificationTokenExpiry).toEqual(expiry);
    });

    it('should allow setting resetPasswordToken', () => {
      const token = 'reset-token-123';
      const user = new User({
        ...validUserData,
        resetPasswordToken: token
      });
      
      expect(user.resetPasswordToken).toBe(token);
    });

    it('should allow setting resetPasswordExpiry', () => {
      const expiry = new Date(Date.now() + 60 * 60 * 1000);
      const user = new User({
        ...validUserData,
        resetPasswordExpiry: expiry
      });
      
      expect(user.resetPasswordExpiry).toEqual(expiry);
    });

    it('should allow storing refresh tokens', () => {
      const tokens = ['token1', 'token2', 'token3'];
      const user = new User({
        ...validUserData,
        refreshTokens: tokens
      });
      
      expect(user.refreshTokens).toEqual(tokens);
    });

    it('should allow setting twoFactorSecret', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const user = new User({
        ...validUserData,
        twoFactorSecret: secret
      });
      
      expect(user.twoFactorSecret).toBe(secret);
    });

    it('should allow setting twoFactorEnabled', () => {
      const user = new User({
        ...validUserData,
        twoFactorEnabled: true
      });
      
      expect(user.twoFactorEnabled).toBe(true);
    });

    it('should allow setting loginAttempts', () => {
      const user = new User({
        ...validUserData,
        loginAttempts: 3
      });
      
      expect(user.loginAttempts).toBe(3);
    });

    it('should allow setting lockUntil', () => {
      const lockTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const user = new User({
        ...validUserData,
        lockUntil: lockTime
      });
      
      expect(user.lockUntil).toEqual(lockTime);
    });
  });

  describe('isLocked Method', () => {
    it('should return false when lockUntil is not set', () => {
      const user = new User(validUserData);
      
      expect(user.isLocked()).toBe(false);
    });

    it('should return false when lockUntil is in the past', () => {
      const user = new User({
        ...validUserData,
        lockUntil: new Date(Date.now() - 1000) // 1 second ago
      });
      
      expect(user.isLocked()).toBe(false);
    });

    it('should return true when lockUntil is in the future', () => {
      const user = new User({
        ...validUserData,
        lockUntil: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
      });
      
      expect(user.isLocked()).toBe(true);
    });

    it('should return false when lockUntil equals current time (edge case)', () => {
      const now = Date.now();
      const user = new User({
        ...validUserData,
        lockUntil: new Date(now)
      });
      
      // Wait a tiny bit to ensure now is in the past
      setTimeout(() => {
        expect(user.isLocked()).toBe(false);
      }, 1);
    });
  });

  describe('incLoginAttempts Method', () => {
    it('should be defined as a method on User schema', () => {
      const user = new User(validUserData);
      
      expect(typeof user.incLoginAttempts).toBe('function');
    });

    it('should return a promise/query object', () => {
      const user = new User(validUserData);
      
      const result = user.incLoginAttempts();
      
      // Should return something with updateOne's promise-like interface
      expect(result).toBeDefined();
      expect(typeof result.then).toBe('function');
    });
  });

  describe('resetLoginAttempts Method', () => {
    it('should be defined as a method on User schema', () => {
      const user = new User(validUserData);
      
      expect(typeof user.resetLoginAttempts).toBe('function');
    });

    it('should return a promise/query object', () => {
      const user = new User(validUserData);
      
      const result = user.resetLoginAttempts();
      
      // Should return something with updateOne's promise-like interface
      expect(result).toBeDefined();
      expect(typeof result.then).toBe('function');
    });
  });

  describe('toJSON Method', () => {
    it('should exclude password from JSON output', () => {
      const user = new User(validUserData);
      const json = user.toJSON();
      
      expect(json.password).toBeUndefined();
      expect(json.username).toBe(validUserData.username);
      expect(json.email).toBe(validUserData.email);
    });

    it('should exclude verificationToken from JSON output', () => {
      const user = new User({
        ...validUserData,
        verificationToken: 'secret-token'
      });
      const json = user.toJSON();
      
      expect(json.verificationToken).toBeUndefined();
    });

    it('should exclude resetPasswordToken from JSON output', () => {
      const user = new User({
        ...validUserData,
        resetPasswordToken: 'reset-token'
      });
      const json = user.toJSON();
      
      expect(json.resetPasswordToken).toBeUndefined();
    });

    it('should exclude refreshTokens from JSON output', () => {
      const user = new User({
        ...validUserData,
        refreshTokens: ['token1', 'token2']
      });
      const json = user.toJSON();
      
      expect(json.refreshTokens).toBeUndefined();
    });

    it('should exclude twoFactorSecret from JSON output', () => {
      const user = new User({
        ...validUserData,
        twoFactorSecret: 'JBSWY3DPEHPK3PXP'
      });
      const json = user.toJSON();
      
      expect(json.twoFactorSecret).toBeUndefined();
    });

    it('should include non-sensitive fields in JSON output', () => {
      const user = new User({
        ...validUserData,
        emailVerified: true,
        twoFactorEnabled: true,
        loginAttempts: 2,
        isAdmin: true,
        desc: 'Test description',
        age: 25,
        from: 'Melbourne'
      });
      const json = user.toJSON();
      
      expect(json.username).toBe(validUserData.username);
      expect(json.email).toBe(validUserData.email);
      expect(json.emailVerified).toBe(true);
      expect(json.twoFactorEnabled).toBe(true);
      expect(json.loginAttempts).toBe(2);
      expect(json.isAdmin).toBe(true);
      expect(json.desc).toBe('Test description');
      expect(json.age).toBe(25);
      expect(json.from).toBe('Melbourne');
    });

    it('should include timestamps in JSON output when they exist', () => {
      const user = new User(validUserData);
      // Manually set timestamps for testing
      user.createdAt = new Date();
      user.updatedAt = new Date();
      
      const json = user.toJSON();
      
      expect(json.createdAt).toBeDefined();
      expect(json.updatedAt).toBeDefined();
    });

    it('should include followers and followings in JSON output', () => {
      const user = new User({
        ...validUserData,
        followers: ['user1', 'user2'],
        followings: ['user3', 'user4']
      });
      const json = user.toJSON();
      
      expect(json.followers).toEqual(['user1', 'user2']);
      expect(json.followings).toEqual(['user3', 'user4']);
    });
  });

  describe('Existing Fields', () => {
    it('should support profilePicture as Buffer', () => {
      const buffer = Buffer.from('image data');
      const user = new User({
        ...validUserData,
        profilePicture: buffer
      });
      
      // Check that it's stored as a Buffer
      expect(Buffer.isBuffer(user.profilePicture)).toBe(true);
      expect(user.profilePicture.toString()).toBe('image data');
    });

    it('should have null as default for profilePicture', () => {
      const user = new User(validUserData);
      
      expect(user.profilePicture).toBeNull();
    });

    it('should support desc field', () => {
      const user = new User({
        ...validUserData,
        desc: 'User description'
      });
      
      expect(user.desc).toBe('User description');
    });

    it('should support age field', () => {
      const user = new User({
        ...validUserData,
        age: 25
      });
      
      expect(user.age).toBe(25);
    });

    it('should support from field', () => {
      const user = new User({
        ...validUserData,
        from: 'Melbourne'
      });
      
      expect(user.from).toBe('Melbourne');
    });

    it('should support isAdmin field', () => {
      const user = new User({
        ...validUserData,
        isAdmin: true
      });
      
      expect(user.isAdmin).toBe(true);
    });
  });
});
