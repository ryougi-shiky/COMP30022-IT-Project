const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const authRouter = require('../routes/auth');
const { generateRefreshToken } = require('../utils/jwtUtils');

// Mock express-rate-limit
jest.mock('express-rate-limit', () => {
  return jest.fn(() => (req, res, next) => next());
});

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/auth', authRouter);

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret-for-testing';
process.env.JWT_EXPIRY = '15m';
process.env.REFRESH_TOKEN_EXPIRY = '7d';

describe('Auth Routes', () => {
  beforeAll(() => {
    // Mock User.findOne
    User.findOne = jest.fn();
    // Mock User.findById
    User.findById = jest.fn();
    // Mock User constructor and save
    User.prototype.save = jest.fn();
    User.prototype.toJSON = jest.fn(function() {
      const obj = {
        _id: this._id,
        username: this.username,
        email: this.email,
        emailVerified: this.emailVerified,
        isAdmin: this.isAdmin
      };
      return obj;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    const validRegisterData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };

    it('should register a new user successfully', async () => {
      User.findOne.mockResolvedValue(null); // No existing user
      
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        username: validRegisterData.username,
        email: validRegisterData.email,
        emailVerified: false,
        isAdmin: false,
        refreshTokens: [],
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          _id: 'mockId',
          username: validRegisterData.username,
          email: validRegisterData.email,
          emailVerified: false,
          isAdmin: false
        })
      };

      User.prototype.save = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/register')
        .send(validRegisterData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Registration successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.username).toBe(validRegisterData.username);
    });

    it('should fail if username is missing', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'All fields are required');
    });

    it('should fail if email is missing', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ username: 'testuser', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'All fields are required');
    });

    it('should fail if password is missing', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ username: 'testuser', email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'All fields are required');
    });

    it('should fail if password is too short', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ username: 'testuser', email: 'test@example.com', password: 'short' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Password must be at least 8 characters long');
    });

    it('should fail if username already exists', async () => {
      User.findOne.mockImplementation((query) => {
        if (query.username) {
          return Promise.resolve({ username: validRegisterData.username });
        }
        return Promise.resolve(null);
      });

      const response = await request(app)
        .post('/auth/register')
        .send(validRegisterData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('type', 'unameDupErr');
      expect(response.body).toHaveProperty('message', 'Username already taken. Please try another one.');
    });

    it('should fail if email already exists', async () => {
      User.findOne.mockImplementation((query) => {
        if (query.username) {
          return Promise.resolve(null);
        }
        if (query.email) {
          return Promise.resolve({ email: validRegisterData.email });
        }
        return Promise.resolve(null);
      });

      const response = await request(app)
        .post('/auth/register')
        .send(validRegisterData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('type', 'emailDupErr');
      expect(response.body).toHaveProperty('message', 'Email already taken. Please try another one.');
    });
  });

  describe('POST /auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash(validLoginData.password, 10);
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        email: validLoginData.email,
        password: hashedPassword,
        loginAttempts: 0,
        refreshTokens: [],
        isLocked: jest.fn().mockReturnValue(false),
        incLoginAttempts: jest.fn(),
        resetLoginAttempts: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          _id: 'mockId',
          email: validLoginData.email,
          username: 'testuser'
        })
      };

      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should fail if email is missing', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Email and password are required');
    });

    it('should fail if password is missing', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Email and password are required');
    });

    it('should fail if user does not exist', async () => {
      User.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Invalid email or password');
    });

    it('should fail if password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash('differentPassword', 10);
      const mockUser = {
        email: validLoginData.email,
        password: hashedPassword,
        isLocked: jest.fn().mockReturnValue(false),
        incLoginAttempts: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid email or password');
      expect(mockUser.incLoginAttempts).toHaveBeenCalled();
    });

    it('should fail if account is locked', async () => {
      const mockUser = {
        email: validLoginData.email,
        password: 'hashedPassword',
        isLocked: jest.fn().mockReturnValue(true)
      };

      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(423);
      expect(response.body).toHaveProperty('message', 'Account is locked due to too many failed login attempts. Please try again later.');
    });

    it('should reset login attempts on successful login', async () => {
      const hashedPassword = await bcrypt.hash(validLoginData.password, 10);
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        email: validLoginData.email,
        password: hashedPassword,
        loginAttempts: 3,
        refreshTokens: [],
        isLocked: jest.fn().mockReturnValue(false),
        resetLoginAttempts: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          _id: 'mockId',
          email: validLoginData.email
        })
      };

      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(200);
      expect(mockUser.resetLoginAttempts).toHaveBeenCalled();
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh tokens successfully with valid refresh token', async () => {
      const userId = new mongoose.Types.ObjectId();
      const refreshToken = generateRefreshToken(userId);

      const mockUser = {
        _id: userId,
        email: 'test@example.com',
        refreshTokens: [refreshToken],
        save: jest.fn().mockResolvedValue(true)
      };

      User.findById.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should fail if refresh token is missing', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Refresh token required');
    });

    it('should fail if refresh token is invalid', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Invalid or expired refresh token');
    });

    it('should fail if refresh token is not in database', async () => {
      const userId = new mongoose.Types.ObjectId();
      const refreshToken = generateRefreshToken(userId);

      const mockUser = {
        _id: userId,
        email: 'test@example.com',
        refreshTokens: [] // Empty array - token not in database
      };

      User.findById.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Invalid refresh token');
    });

    it('should fail if user does not exist', async () => {
      const userId = new mongoose.Types.ObjectId();
      const refreshToken = generateRefreshToken(userId);

      User.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Invalid refresh token');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully with valid refresh token', async () => {
      const userId = new mongoose.Types.ObjectId();
      const refreshToken = generateRefreshToken(userId);

      const mockUser = {
        _id: userId,
        refreshTokens: [refreshToken],
        save: jest.fn().mockResolvedValue(true)
      };

      User.findById.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/logout')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logout successful');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should succeed even without refresh token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logout successful');
    });

    it('should handle invalid refresh token gracefully', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logout successful');
    });
  });

  describe('POST /auth/logout-all', () => {
    it('should logout from all devices successfully', async () => {
      const userId = new mongoose.Types.ObjectId();
      const refreshToken = generateRefreshToken(userId);

      const mockUser = {
        _id: userId,
        refreshTokens: [refreshToken, 'another-token'],
        save: jest.fn().mockResolvedValue(true)
      };

      User.findById.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/logout-all')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logged out from all devices');
      expect(mockUser.refreshTokens).toEqual([]);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should fail if refresh token is missing', async () => {
      const response = await request(app)
        .post('/auth/logout-all')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Refresh token required');
    });

    it('should fail if refresh token is invalid', async () => {
      const response = await request(app)
        .post('/auth/logout-all')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Invalid token');
    });
  });

});
