# E2E Test Suite

## Test Sequence

The E2E tests are designed to run in a specific sequence to ensure a consistent testing flow:

1. **Register Test** (`register.cy.js`) - Creates a new user with unique credentials
2. **Login Test** (`login.cy.js`) - Logs in using the newly registered user
3. **Home Test** (`home.cy.js`) - Tests home page functionality with the logged-in user
4. **Profile Test** (`profile.cy.js`) - Tests profile page functionality with the logged-in user

## How Test Data is Shared

The test suite uses Cypress tasks to share user credentials between test files:

1. **After Registration**: The `register.cy.js` test saves the newly created user credentials (username, email, password) to a fixture file `cypress/fixtures/testUser.json` using the `writeUserData` task.

2. **Before Other Tests**: Each subsequent test file (`login.cy.js`, `home.cy.js`, `profile.cy.js`) reads the user credentials from the fixture file using the `readUserData` task in its `before()` hook.

3. **During Tests**: The tests use the loaded user credentials to login and perform actions as that specific user.

## Implementation Details

### Cypress Tasks (defined in `cypress.config.js`)

- `writeUserData(userData)` - Writes user credentials to `cypress/fixtures/testUser.json`
- `readUserData()` - Reads user credentials from `cypress/fixtures/testUser.json`
- `deleteUserData()` - Deletes the test user data file (for cleanup)

### Test Structure

Each test file (except `register.cy.js`) follows this pattern:

```javascript
let testUser;

before(() => {
  // Read the user data created in the register test
  cy.task('readUserData').then((userData) => {
    testUser = userData;
  });
});

beforeEach(() => {
  // Use testUser.email, testUser.password, testUser.username
});
```

## Running Tests

To ensure the test sequence works correctly:

1. Tests must be run in order: register → login → home → profile
2. The test runner script (`auto/run-e2e-tests-on-deployed-app`) already runs tests in the correct order
3. The fixture file is excluded from git via `.gitignore`

## Important Notes

- The `testUser.json` fixture file is automatically created during test execution and should not be committed to git
- Tests depend on each other running in sequence
- A fresh user is created each time the register test runs (using timestamp-based unique ID)
