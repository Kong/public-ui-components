// Import custom Cypress commands
import './commands'

// Suppress uncaught exceptions from @vue/devtools-kit that occur during test teardown.
// Cypress 15.x now forwards unhandled promise rejections as test failures, but this error
// originates from Vue DevTools internals and is not related to the component under test.
Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes("Cannot read properties of undefined (reading 'app')")) {
    return false
  }
})
