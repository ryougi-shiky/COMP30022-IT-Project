const { defineConfig } = require("cypress");
const fs = require("fs");
const path = require("path");

module.exports = defineConfig({
  // Default timeout for most commands, can be overridden by env var
  defaultCommandTimeout: process.env.CYPRESS_DEFAULT_COMMAND_TIMEOUT
    ? parseInt(process.env.CYPRESS_DEFAULT_COMMAND_TIMEOUT)
    : 8000,

  // Timeout for waiting for a page to load, can be overridden by env var
  pageLoadTimeout: process.env.CYPRESS_PAGE_LOAD_TIMEOUT
    ? parseInt(process.env.CYPRESS_PAGE_LOAD_TIMEOUT)
    : 120000,

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
