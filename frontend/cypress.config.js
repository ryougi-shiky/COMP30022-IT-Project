const { defineConfig } = require("cypress");
const fs = require("fs");
const path = require("path");

module.exports = defineConfig({
  // Default timeout for most commands, can be overridden by env var
  defaultCommandTimeout: process.env.CYPRESS_DEFAULT_COMMAND_TIMEOUT
    ? parseInt(process.env.CYPRESS_DEFAULT_COMMAND_TIMEOUT)
    : 10000,

  // Timeout for waiting for a page to load, can be overridden by env var
  pageLoadTimeout: process.env.CYPRESS_PAGE_LOAD_TIMEOUT
    ? parseInt(process.env.CYPRESS_PAGE_LOAD_TIMEOUT)
    : 120000,

  // Timeout for cy.request(), cy.wait(), cy.fixture(), etc., can be overridden by env var
  responseTimeout: process.env.CYPRESS_RESPONSE_TIMEOUT
    ? parseInt(process.env.CYPRESS_RESPONSE_TIMEOUT)
    : 30000,

  // Timeout for cy.task(), can be overridden by env var
  taskTimeout: process.env.CYPRESS_TASK_TIMEOUT
    ? parseInt(process.env.CYPRESS_TASK_TIMEOUT)
    : 60000,

  // Retry failed tests automatically - helps with flaky tests in CI
  retries: {
    // Retry failed tests in run mode (CI)
    runMode: process.env.CYPRESS_RETRIES
      ? parseInt(process.env.CYPRESS_RETRIES)
      : 2,
    // No retries in interactive (open) mode
    openMode: 0,
  },

  e2e: {
    // This is the default baseUrl.
    // It can be overridden by the CYPRESS_BASE_URL environment variable.
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on, config) {
      const userDataPath = path.join(__dirname, "cypress", "fixtures", "testUser.json");
      
      // Task to write user data to a fixture file
      on("task", {
        writeUserData(userData) {
          const fixturesDir = path.dirname(userDataPath);
          if (!fs.existsSync(fixturesDir)) {
            fs.mkdirSync(fixturesDir, { recursive: true });
          }
          fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2));
          return null;
        },
        
        // Task to read user data from fixture file
        readUserData() {
          if (fs.existsSync(userDataPath)) {
            try {
              const data = fs.readFileSync(userDataPath, "utf8");
              return JSON.parse(data);
            } catch (error) {
              console.error("Error reading or parsing testUser.json:", error);
              return null;
            }
          }
          return null;
        },
        
        // Task to clean up user data
        deleteUserData() {
          if (fs.existsSync(userDataPath)) {
            fs.unlinkSync(userDataPath);
          }
          return null;
        }
      });
    },
  },
  env: {
    // You can add other environment variables here
  },
});
