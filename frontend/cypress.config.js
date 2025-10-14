const { defineConfig } = require("cypress");

module.exports = defineConfig({
  // Default timeout for most commands, can be overridden by env var
  defaultCommandTimeout: process.env.CYPRESS_DEFAULT_COMMAND_TIMEOUT
    ? parseInt(process.env.CYPRESS_DEFAULT_COMMAND_TIMEOUT)
    : 8000,

  e2e: {
    // This is the default baseUrl.
    // It can be overridden by the CYPRESS_BASE_URL environment variable.
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  env: {
    // You can add other environment variables here
  },
});
