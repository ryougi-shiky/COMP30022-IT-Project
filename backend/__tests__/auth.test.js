const request = require('supertest');
const express = require('express');
const authRouter = require('../routes/auth');
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Set test environment
process.env.NODE_ENV = 'test';

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-at-least-32-characters-long';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-key-at-least-32-characters-long';
process.env.JWT_EXPIRY = '15m';
process.env.REFRESH_TOKEN_EXPIRY = '7d';

// Mock the User model
jest.mock('../models/User');

let app;

beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use('/users/auth', authRouter);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Auth Routes', () => {
  describe('POST /users/auth/register', () => {
    const validUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword123'
    };

    it('should register a new user successfully', async () => {
      const mockSave = jest.fn().mockImplementation(function() {
        return Promise.resolve(this);
      });
      const mockToJSON = jest.fn().mockReturnValue({
        _id: '507f1f77bcf86cd799439011',
        username: validUser.username,
        email: validUser.email
      });

      // Create a constructor function that returns an object with save and toJSON methods
      User.findOne.mockResolvedValue(null);
      User.mockImplementation(function(data) {
        this._id = '507f1f77bcf86cd799439011';
        this.username = data.username;
        this.email = data.email;
        this.password = data.password;
        this.refreshTokens = [];
        this.save = mockSave.bind(this);
        this.toJSON = mockToJSON;
        return this;
      });

      const res = await request(app)
        .post('/users/auth/register')
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Registration successful');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe(validUser.username);
      expect(res.body.user.email).toBe(validUser.email);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(mockSave).toHaveBeenCalled();
    });

    it('should reject registration with missing fields', async () => {
      const res = await request(app)
        .post('/users/auth/register')
        .send({ username: 'test' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('All fields are required');
    });

    it('should reject registration with short password', async () => {
      const res = await request(app)
        .post('/users/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'short'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Password must be at least 8 characters long');
    });

    it('should reject duplicate username', async () => {
      User.findOne.mockResolvedValueOnce({ username: validUser.username });

      const res = await request(app)
        .post('/users/auth/register')
        .send(validUser);

      expect(res.status).toBe(400);
      expect(res.body.type).toBe('unameDupErr');
      expect(res.body.message).toContain('Username already taken');
    });

    it('should reject duplicate email', async () => {
      User.findOne.mockResolvedValueOnce(null);
      User.findOne.mockResolvedValueOnce({ email: validUser.email });

      const res = await request(app)
        .post('/users/auth/register')
        .send(validUser);

      expect(res.status).toBe(400);
      expect(res.body.type).toBe('emailDupErr');
      expect(res.body.message).toContain('Email already taken');
    });
  });

  describe('POST /users/auth/login', () => {
    const validUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword123'
    };

    it('should login successfully with correct credentials', async () => {
      const hashedPassword = await bcrypt.hash(validUser.password, 10);
      const mockSave = jest.fn().mockResolvedValue(true);
      const mockResetLoginAttempts = jest.fn().mockResolvedValue(true);
      const mockToJSON = jest.fn().mockReturnValue({
        _id: '507f1f77bcf86cd799439011',
        username: validUser.username,
        email: validUser.email
      });

      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: validUser.email,
        password: hashedPassword,
        refreshTokens: [],
        loginAttempts: 0,
        isLocked: jest.fn().mockReturnValue(false),
        resetLoginAttempts: mockResetLoginAttempts,
        save: mockSave,
        toJSON: mockToJSON
      };

      User.findOne.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/users/auth/login')
        .send({
          email: validUser.email,
          password: validUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.user).toBeDefined();
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(mockSave).toHaveBeenCalled();
    });

    it('should reject login with missing fields', async () => {
      const res = await request(app)
        .post('/users/auth/login')
        .send({ email: validUser.email });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Email and password are required');
    });

    it('should reject login with non-existent email', async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/users/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should reject login with wrong password', async () => {
      const hashedPassword = await bcrypt.hash(validUser.password, 10);
      const mockIncLoginAttempts = jest.fn().mockResolvedValue(true);

      const mockUser = {
        email: validUser.email,
        password: hashedPassword,
        isLocked: jest.fn().mockReturnValue(false),
        incLoginAttempts: mockIncLoginAttempts
      };

      User.findOne.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/users/auth/login')
        .send({
          email: validUser.email,
          password: 'wrongpassword'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid email or password');
      expect(mockIncLoginAttempts).toHaveBeenCalled();
    });

    it('should reject login for locked account', async () => {
      const mockUser = {
        email: validUser.email,
        isLocked: jest.fn().mockReturnValue(true)
      };

      User.findOne.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/users/auth/login')
        .send({
          email: validUser.email,
          password: validUser.password
        });

      expect(res.status).toBe(423);
      expect(res.body.message).toContain('Account is locked');
    });
  });

  describe('POST /users/auth/refresh', () => {
    it('should refresh tokens successfully', async () => {
      const { generateRefreshToken } = require('../utils/jwtUtils');
      const mockUserId = '507f1f77bcf86cd799439011';
      const refreshToken = generateRefreshToken(mockUserId);
      
      const mockSave = jest.fn().mockResolvedValue(true);
      const mockUser = {
        _id: mockUserId,
        email: 'test@example.com',
        refreshTokens: [refreshToken],
        save: mockSave
      };

      User.findById.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/users/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(mockSave).toHaveBeenCalled();
    });

    it('should reject refresh without token', async () => {
      const res = await request(app)
        .post('/users/auth/refresh')
        .send({});

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Refresh token required');
    });

    it('should reject invalid refresh token', async () => {
      const res = await request(app)
        .post('/users/auth/refresh')
        .send({ refreshToken: 'invalid.token.here' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Invalid or expired refresh token');
    });

    it('should reject refresh token not in database', async () => {
      const { generateRefreshToken } = require('../utils/jwtUtils');
      const mockUserId = '507f1f77bcf86cd799439011';
      const validToken = generateRefreshToken(mockUserId);
      
      const mockUser = {
        _id: mockUserId,
        refreshTokens: [] // Token not in array
      };

      User.findById.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/users/auth/refresh')
        .send({ refreshToken: validToken });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Invalid refresh token');
    });
  });

  describe('POST /users/auth/logout', () => {
    it('should logout successfully', async () => {
      const { generateRefreshToken } = require('../utils/jwtUtils');
      const mockUserId = '507f1f77bcf86cd799439011';
      const refreshToken = generateRefreshToken(mockUserId);
      
      const mockSave = jest.fn().mockResolvedValue(true);
      const mockUser = {
        _id: mockUserId,
        refreshTokens: [refreshToken],
        save: mockSave
      };

      User.findById.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/users/auth/logout')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logout successful');
      expect(mockSave).toHaveBeenCalled();
    });

    it('should succeed even without refresh token', async () => {
      const res = await request(app)
        .post('/users/auth/logout')
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logout successful');
    });
  });

  describe('POST /users/auth/logout-all', () => {
    it('should logout from all devices successfully', async () => {
      const { generateRefreshToken } = require('../utils/jwtUtils');
      const mockUserId = '507f1f77bcf86cd799439011';
      const refreshToken = generateRefreshToken(mockUserId);
      
      const mockSave = jest.fn().mockResolvedValue(true);
      const mockUser = {
        _id: mockUserId,
        refreshTokens: [refreshToken, 'token2', 'token3'],
        save: mockSave
      };

      User.findById.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/users/auth/logout-all')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logged out from all devices');
      expect(mockUser.refreshTokens).toHaveLength(0);
      expect(mockSave).toHaveBeenCalled();
    });

    it('should reject logout-all without refresh token', async () => {
      const res = await request(app)
        .post('/users/auth/logout-all')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Refresh token required');
    });

    it('should reject logout-all with invalid token', async () => {
      const res = await request(app)
        .post('/users/auth/logout-all')
        .send({ refreshToken: 'invalid.token' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Invalid token');
    });
  });
});
