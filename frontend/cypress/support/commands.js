Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login')
  cy.get('input[placeholder="Email"]').type(email)
  cy.get('input[placeholder="Password"]').type(password)
  cy.get('button[type="submit"]').click()
})

/**
 * Custom command to wait for an API call with a configurable timeout.
 * This helps prevent timeout issues when testing against remote deployments.
 * 
 * @param {string} alias - The alias of the intercept (without @)
 * @param {object} options - Optional configuration
 * @param {number} options.timeout - Custom timeout in milliseconds (default: uses responseTimeout from config)
 * @returns {Cypress.Chainable} - The intercepted request
 */
Cypress.Commands.add('waitForApi', (alias, options = {}) => {
  const timeout = options.timeout || Cypress.config('responseTimeout');
  return cy.wait(`@${alias}`, { timeout });
})
