# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A forum web application (AniAni) built for COMP30022 at the University of Melbourne. Users can register, post, comment, like, follow others, and receive notifications.

## Tech Stack

- **Frontend**: React 18 (CRA), MUI v7, React Router v7, Axios — `frontend/`
- **Backend**: Express 5, Mongoose 8, JWT auth (access 15m / refresh 7d), bcrypt — `backend/`
- **DB**: MongoDB, database name `ani` — `db/`
- **Infra**: Nginx reverse proxy, Docker Compose — `deploy/`, `nginx/`
- **Language**: JavaScript only (no TypeScript). CommonJS in backend, ES modules in frontend.

## Architecture

```
Browser → Nginx (:3000)
           ├── static React build        (location /)
           └── proxy /api/* → Express    (:17000)
                               └── MongoDB (:27017)
```

Docker Compose variants: `deploy/docker-compose.local.yml` (dev), `.test.yml` (CI).

In dev (CRA), `proxy: http://server:17000` in `frontend/package.json` forwards API calls.

## Development Commands

### Launch full app (Docker required)
```bash
ENV=local ./auto/launch-app
```

### Run backend unit tests (containerized)
```bash
./auto/run-backend-unit-tests
```

### Run backend tests locally (without Docker)
```bash
cd backend
JWT_SECRET="test-jwt-secret-key-for-ci-testing-min-32-characters" \
REFRESH_TOKEN_SECRET="test-refresh-token-secret-for-ci-testing-min-32-chars" \
NODE_ENV=test \
npm test
```

### Run a single backend test file
```bash
cd backend
JWT_SECRET="test-jwt-secret-key-for-ci-testing-min-32-characters" \
REFRESH_TOKEN_SECRET="test-refresh-token-secret-for-ci-testing-min-32-chars" \
NODE_ENV=test \
npx jest --detectOpenHandles --forceExit __tests__/authRoutes.test.js
```

### Run frontend tests
```bash
cd frontend && npm test
```

### Run E2E tests (requires app running)
```bash
ENV=test ./auto/run-e2e-tests
```

### Cypress E2E locally (app must be running on localhost:3000)
```bash
cd frontend && npx cypress run --spec "cypress/e2e/login.cy.js"
```

## Backend Structure

Routes are mounted in `server.js`:
- `/users/auth` — register, login, logout, refresh tokens (`routes/auth.js`)
- `/users` — user CRUD, follow/unfollow, profile picture (`routes/user.js`)
- `/users/post` — posts, likes, comments (`routes/post.js`)
- `/users/notify` — notifications (`routes/notify.js`)
- `/users/search` — user search (`routes/search.js`)
- `/healthcheck` — liveness probe (`routes/healthcheck.js`)

Middleware chain: `express.json` → `helmet` → `morgan` → `cors` (whitelist from `CORS_WHITELIST` env var).

Auth: `middleware/authMiddleware.js` verifies JWT; attach to protected routes individually.

Models in `models/`: User, Post, Notification.

## Frontend Structure

- `src/pages/` — Home, Profile, Login, Register, Moments, HealthCheck
- `src/components/` — topbar, sidebar, rightbar, feed, post, share, weather, etc.
- `src/context/` — AuthContext + AuthReducer (useReducer, persisted to localStorage)
- `src/apiCall.js` — Axios wrapper for all API requests

Unauthenticated users redirect to `/register`.

## Code Conventions

- Functional React components with hooks only.
- Backend error responses: `res.status(4xx/5xx).json({ message: "..." })`. Success: `res.status(200/201).json(data)`.
- Rate limiting on auth routes (relaxed in `NODE_ENV === 'development'` or `'test'`).
- `User.toJSON()` strips sensitive fields — never manually delete password/tokens from responses.
- Profile pictures stored as raw Buffer in MongoDB, base64-encoded when sent to frontend. Max 256 KB via multer.
- Passwords hashed with bcrypt (salt rounds: 10).

## Git Conventions

- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- One concern per PR. Link issues with `Fixes #<number>`.

## Environment Variables (Backend)

Required: `MONGODB_URI`, `MONGODB_NAME`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `PORT`, `CORS_WHITELIST`
Optional: `JWT_EXPIRY` (default 15m), `REFRESH_TOKEN_EXPIRY` (default 7d), `NODE_ENV`

## Node Version

Requires Node >=22.0.0 <23.0.0, npm >=9.0.0 <12.0.0 (per `backend/package.json` engines).
