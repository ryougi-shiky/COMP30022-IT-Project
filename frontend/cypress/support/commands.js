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
 * @param {string} alias - The alias of the intercept (without @). Must be a non-empty string.
 * @param {object} [options={}] - Optional configuration
 * @param {number} [options.timeout] - Custom timeout in milliseconds (default: uses responseTimeout from config)
 * @returns {Cypress.Chainable} - The intercepted request
 * @example cy.waitForApi('registerRequest')
 * @example cy.waitForApi('loginRequest', { timeout: 60000 })
 */
Cypress.Commands.add('waitForApi', (alias, options = {}) => {
  if (!alias || typeof alias !== 'string') {
    throw new Error('waitForApi requires a valid string alias');
  }
  const timeout = options.timeout || Cypress.config('responseTimeout');
  return cy.wait(`@${alias}`, { timeout });
})
