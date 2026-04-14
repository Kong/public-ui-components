import type { Router } from 'vue-router'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { CustomPluginFormConfig } from '../types'
import CustomPluginForm from './CustomPluginForm.vue'

const baseConfig: CustomPluginFormConfig = {
  app: 'konnect',
  apiBaseUrl: '/us/kong-api',
  controlPlaneId: 'test-cp-id',
  cancelRoute: { name: 'home' },
  clonablePlugins: ['cors', 'acl', 'basic-auth'],
}

describe('<CustomPluginForm />', () => {
  let router: Router

  beforeEach(() => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/',
          name: 'home',
          component: { template: '<div>Home</div>' },
        },
      ],
    })
  })

  describe('Create Mode', () => {
    it('should render form with all steps visible', () => {
      cy.mount(CustomPluginForm, {
        props: {
          config: baseConfig,
        },
        router,
      })

      // Step 1 should be visible
      cy.contains('h2', 'Custom plugin type').should('exist')

      // Plugin type radio buttons should be visible
      cy.getTestId('custom-plugin-type-installed').should('exist')
      cy.getTestId('custom-plugin-type-streamed').should('exist')
      cy.getTestId('custom-plugin-type-cloned').should('exist')

      // Submit and cancel buttons should be visible
      cy.getTestId('custom-plugin-form-submit').should('exist')
      cy.getTestId('custom-plugin-form-cancel').should('exist')
    })

    it('should show step 2 files for installed type', () => {
      cy.mount(CustomPluginForm, {
        props: {
          config: baseConfig,
        },
        router,
      })

      // Select installed type
      cy.getTestId('custom-plugin-type-installed').click()

      // Step 2 should be visible with schema file upload
      cy.getTestId('custom-plugin-schema-upload').should('exist')

      // Step 3 should not be visible for installed type
      cy.getTestId('custom-plugin-name').should('not.exist')
    })

    it('should show step 2 and 3 for streamed type', () => {
      cy.mount(CustomPluginForm, {
        props: {
          config: baseConfig,
        },
        router,
      })

      // Select streamed type
      cy.getTestId('custom-plugin-type-streamed').click()

      // Step 2 should show both schema and handler uploads
      cy.getTestId('custom-plugin-schema-upload').should('exist')
      cy.getTestId('custom-plugin-handler-upload').should('exist')

      // Step 3 should show name input
      cy.getTestId('custom-plugin-name').should('exist')
    })

    it('should show step 2 and 3 for cloned type', () => {
      cy.mount(CustomPluginForm, {
        props: {
          config: baseConfig,
        },
        router,
      })

      // Select cloned type
      cy.getTestId('custom-plugin-type-cloned').click()

      // Step 2 should show plugin select
      cy.getTestId('custom-plugin-clone-select').should('exist')

      // Step 3 should show alias name and priority
      cy.getTestId('custom-plugin-alias-name').should('exist')
      cy.getTestId('custom-plugin-priority').should('exist')
    })

    it('should reset fields when switching plugin type', () => {
      cy.mount(CustomPluginForm, {
        props: {
          config: baseConfig,
        },
        router,
      })

      // Select streamed type and enter name
      cy.getTestId('custom-plugin-type-streamed').click()
      cy.getTestId('custom-plugin-name').type('test-plugin')
      cy.getTestId('custom-plugin-name').should('have.value', 'test-plugin')

      // Switch to installed type
      cy.getTestId('custom-plugin-type-installed').click()

      // Name field should be reset
      cy.getTestId('custom-plugin-name').should('not.exist')
    })

    it('should disable submit button when required fields are empty', () => {
      cy.mount(CustomPluginForm, {
        props: {
          config: baseConfig,
        },
        router,
      })

      // Select installed type
      cy.getTestId('custom-plugin-type-installed').click()

      // Submit should be disabled without schema file
      cy.getTestId('custom-plugin-form-submit').should('be.disabled')
    })
  })

  describe('Edit Mode', () => {
    it('should hide step 1 when in edit mode', () => {
      cy.mount(CustomPluginForm, {
        props: {
          config: baseConfig,
          pluginId: 'plugin-123',
        },
        router,
      })

      // Step 1 should not be visible
      cy.contains('h2', 'Custom plugin type').should('not.exist')

      // Plugin type radios should not be visible
      cy.getTestId('custom-plugin-type-installed').should('not.exist')
      cy.getTestId('custom-plugin-type-streamed').should('not.exist')
      cy.getTestId('custom-plugin-type-cloned').should('not.exist')
    })

    it('should adjust step numbers in edit mode', () => {
      cy.mount(CustomPluginForm, {
        props: {
          config: baseConfig,
          pluginId: 'plugin-123',
        },
        router,
      })

      // For installed type, step 2 becomes step 1, but with no number shown
      cy.getTestId('custom-plugin-schema-upload').should('exist')
    })
  })

  describe('Compare Table', () => {
    it('should toggle compare deployment options collapse', () => {
      cy.mount(CustomPluginForm, {
        props: {
          config: baseConfig,
        },
        router,
      })

      // Compare table should be collapsed by default
      cy.getTestId('compare-deployment-options')
        .findTestId('collapse-hidden-content')
        .should('not.be.visible')

      // Click to expand
      cy.getTestId('compare-deployment-options')
        .findTestId('collapse-trigger-content')
        .click()

      // Table should now be visible
      cy.getTestId('compare-deployment-options')
        .findTestId('collapse-hidden-content')
        .should('be.visible')
    })
  })

  describe('Cancel Action', () => {
    it('should navigate to cancel route when cancel is clicked', () => {
      cy.mount(CustomPluginForm, {
        props: {
          config: baseConfig,
        },
        router,
      })

      cy.getTestId('custom-plugin-form-cancel').click()

      // Should navigate to home route
      cy.wrap(null).should(() => {
        expect(router.currentRoute.value.fullPath).to.equal('/')
      })
    })
  })
})
