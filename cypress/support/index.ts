// Import custom Cypress commands
import './commands'

// Ignore unhandled errors from Vue DevTools internals
Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes("Cannot read properties of undefined (reading 'app')")) {
    return false
  }
})
