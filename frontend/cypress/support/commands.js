Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login')
  cy.get('input[placeholder="Email"]').type(email)
  cy.get('input[placeholder="Password"]').type(password)
  cy.get('button[type="submit"]').click()
})
