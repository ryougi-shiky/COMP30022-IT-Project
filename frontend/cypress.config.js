const { defineConfig } = require("cypress");

const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';

module.exports = defineConfig({
  e2e: {
    baseUrl: appBaseUrl,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  env: {
    apiUrl: 'http://localhost:17000',
  }
});
