# Copilot Instructions

## Stack
- **Frontend**: React 18 (CRA), MUI v7, React Router v7, Axios, Recharts — `frontend/`
- **Backend**: Express 5, Mongoose 8, JWT (access 15m / refresh 7d), bcrypt — `backend/`
- **DB**: MongoDB, database name `ani` — `db/`
- **Infra**: Nginx reverse proxy, Docker Compose, GitHub Actions CI, SonarQube — `nginx/`, `deploy/`, `infra/`
- **Language**: JavaScript only (no TypeScript). CommonJS in backend, ES modules in frontend.

## Architecture

```
Browser → Nginx (:3000)
           ├── static React build        (location /)
           └── proxy /api/* → Express    (:17000)
                               └── MongoDB (:27017)
```

Docker Compose variants: `deploy/docker-compose.local.yml` (dev), `.test.yml` (CI).

### Frontend layout
| Path | Purpose |
|---|---|
| `src/pages/` | `Home`, `Profile`, `Login`, `Register`, `Moments`, `HealthCheck` |
| `src/components/` | `topbar`, `sidebar`, `rightbar`, `feed`, `feedMoments`, `post`, `share`, `message`, `conversation`, `leftFriends`, `onlineFriends`, `chatOnline`, `weather` |
| `src/context/` | `AuthContext` + `AuthReducer` — global auth state via `useReducer`, persisted to `localStorage` |
| `src/apiCall.js` | Axios wrapper for all API requests |

- Unauthenticated users are redirected to `/register`. Auth state comes from `AuthContext`.
- In dev (CRA), `proxy: http://server:17000` in `package.json` forwards API calls. In production, Nginx proxies `/api/*`.

### Backend layout
| Router | Mount | Key endpoints |
|---|---|---|
| `auth.js` | `/users/auth` | POST register, login, logout, logout-all, refresh |
| `user.js` | `/users` | GET `/?uid=` or `/?username=`, PUT update/follow/unfollow/profilePicture, DELETE delete |
| `post.js` | `/users/post` | POST create, PUT update/delete/like/postcomment, GET getpost/moments/profile/allposts |
| `notify.js` | `/users/notify` | POST create/follow, GET get/follow/:id, DELETE delete/follow/:id |
| `search.js` | `/users/search` | user search |
| `healthcheck.js` | `/healthcheck` | liveness probe |

Global middleware: `express.json` → `helmet` → `morgan` → `cors` (whitelist from `CORS_WHITELIST` env var).  
Auth middleware: `backend/middleware/authMiddleware.js` — verifies JWT, attach to protected routes individually.

### Data models
**User**: `username` (unique, 2–25), `email` (unique), `password` (bcrypt, 60 chars), `profilePicture` (Buffer), `followers[]`, `followings[]`, `refreshTokens[]` (max 5), `loginAttempts`, `lockUntil` (lock after 5 fails, 2h), `isAdmin`, `desc`, `age`, `from`, `emailVerified`, `twoFactorEnabled`  
**Post**: `uid`, `username`, `desc`, `img`, `likes[]`, `comments[]` (`commenterId`, `commenterName`, `text`, `timestamp`)  
**Notification**: `notifyFrom`, `notifyTo`, `type` (`likePost`|`follow`), `status` (`read`|`unread`), `content`

## Code Conventions
- Functional React components with hooks only.
- File naming: camelCase for non-components, PascalCase for React component files.
- Backend error responses: `res.status(4xx/5xx).json({ message: "..." })`. Success: `res.status(200/201).json(data)`.
- Use appropriate HTTP codes: 200, 201, 400, 401, 403, 404, 423, 500.
- Rate limiting on auth routes — limits relaxed in `NODE_ENV === 'development'` or `'test'`.
- `User.toJSON()` strips `password`, `verificationToken`, `resetPasswordToken`, `refreshTokens`, `twoFactorSecret` — never manually delete these fields.
- Profile pictures are stored as raw `Buffer` in MongoDB, base64-encoded when sent to the frontend.
- File uploads via `multer`; max profile picture size: 256 KB.

## Security Rules
- All protected routes must use `authMiddleware`. Never skip it.
- Never log or expose JWT secrets, passwords, or `.env` values.
- Always hash passwords with `bcrypt` (salt rounds: 10). Never store plaintext.
- Validate and sanitize all user inputs before saving to MongoDB.
- Access tokens expire in 15m, refresh tokens in 7d. Refresh tokens are stored in `User.refreshTokens` (max 5) and must be invalidated on logout.

## Testing
| Layer | Tool | Location | Run command |
|---|---|---|---|
| Backend unit/integration | Jest + Supertest | `backend/__tests__/**/*.test.js` | `cd backend && npm test` |
| Frontend unit | React Testing Library | `frontend/src/**/*.test.js` | `cd frontend && npm test` |
| E2E | Cypress | `frontend/cypress/` | `cd frontend && npm run cypress:run` |

- Always add or update tests when changing backend routes or models.
- Backend Jest config: `testEnvironment: node`, `--detectOpenHandles --forceExit`.

## Git / PRs
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- Fill in `.github/PULL_REQUEST_TEMPLATE.md`. Link issues with `Fixes #<number>`.
- One concern per PR. Pass all CI checks before requesting review.
