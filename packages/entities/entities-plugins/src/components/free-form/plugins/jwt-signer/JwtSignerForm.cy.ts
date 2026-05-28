import JwtSignerForm from './JwtSignerForm.vue'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import type { FormSchema } from '../../../../types/plugins/form-schema'

const ERROR_MESSAGE_FRAGMENT = 'HTTP/HTTPS URL'

const createSchema = (): FormSchema => ({
  type: 'record',
  fields: [{
    config: {
      type: 'record',
      required: true,
      fields: [
        { access_token_keyset: { type: 'string', default: 'kong' } },
        { access_token_signing: { type: 'boolean', default: true } },
        { access_token_upstream_header: { type: 'string', default: 'Authorization:Bearer' } },
        { channel_token_keyset: { type: 'string', default: 'kong' } },
        { channel_token_signing: { type: 'boolean', default: true } },
        { channel_token_upstream_header: { type: 'string' } },
      ],
    },
  }],
})

const RENDER_RULES = {
  bundles: [
    ['config.access_token_signing', 'config.access_token_upstream_header', 'config.access_token_keyset'],
    ['config.channel_token_signing', 'config.channel_token_upstream_header', 'config.channel_token_keyset'],
  ],
}

interface MountOptions {
  isEditing?: boolean
  model?: Record<string, any>
  app?: 'konnect' | 'kongManager'
}

const mountForm = (options: MountOptions = {}) => {
  const { isEditing = false, model, app = 'konnect' } = options

  const formsConfig = app === 'konnect'
    ? { app: 'konnect' as const, apiBaseUrl: '/us/kong-api', controlPlaneId: '123' }
    : { app: 'kongManager' as const, apiBaseUrl: '/kong-manager' }

  cy.mount(JwtSignerForm as any, {
    props: {
      schema: createSchema(),
      formSchema: {},
      formModel: {},
      model: model ?? {},
      isEditing,
      pluginName: 'jwt-signer',
      renderRules: RENDER_RULES,
      onFormChange: cy.spy().as('onFormChange'),
    },
    global: {
      provide: {
        [FORMS_CONFIG]: formsConfig,
      },
    },
  })
}

const keysetInput = (scope: 'access' | 'channel') =>
  cy.getTestId(`ff-config.${scope}_token_keyset`)

const expectKeysetError = (scope: 'access' | 'channel', textFragment = ERROR_MESSAGE_FRAGMENT) => {
  keysetInput(scope).parents('.k-input.input-error').should('exist')
  keysetInput(scope).parents('.k-input').find('.help-text').should('contain.text', textFragment)
}

const expectNoKeysetError = (scope: 'access' | 'channel') => {
  keysetInput(scope).parents('.k-input.input-error').should('not.exist')
}

describe('<JwtSignerForm /> - keyset URL validation', () => {
  describe('Konnect', () => {
    it('flags the default "kong" keyset as invalid when preconditions are met', () => {
      mountForm()
      expectKeysetError('access')
    })

    it('includes both precondition field labels in the error message', () => {
      mountForm()
      keysetInput('access').parents('.k-input').find('.help-text')
        .should('contain.text', 'Access token signing')
        .and('contain.text', 'Access token upstream header')
    })

    it('clears the error when the user enters a valid http URL', () => {
      mountForm()
      expectKeysetError('access')
      keysetInput('access').clear().type('http://idp.example.com/.well-known/jwks.json')
      expectNoKeysetError('access')
    })

    it('clears the error when the user enters a valid https URL', () => {
      mountForm()
      keysetInput('access').clear().type('https://idp.example.com/jwks')
      expectNoKeysetError('access')
    })

    it('flags non-http schemes such as ftp://', () => {
      mountForm()
      keysetInput('access').clear().type('ftp://idp.example.com/jwks')
      expectKeysetError('access')
    })

    it('flags an empty keyset', () => {
      mountForm({
        isEditing: true,
        model: {
          config: {
            access_token_signing: true,
            access_token_upstream_header: 'Authorization:Bearer',
            access_token_keyset: '',
            channel_token_signing: false,
          },
        },
      })
      expectKeysetError('access')
    })

    it('flags a null keyset', () => {
      mountForm({
        isEditing: true,
        model: {
          config: {
            access_token_signing: true,
            access_token_upstream_header: 'Authorization:Bearer',
            access_token_keyset: null,
            channel_token_signing: false,
          },
        },
      })
      expectKeysetError('access')
    })

    it('does not flag the keyset when signing is disabled', () => {
      mountForm({
        isEditing: true,
        model: {
          config: {
            access_token_signing: false,
            access_token_upstream_header: 'Authorization:Bearer',
            access_token_keyset: 'kong',
            channel_token_signing: false,
          },
        },
      })
      expectNoKeysetError('access')
    })

    it('does not flag the keyset when the upstream header is empty', () => {
      mountForm({
        isEditing: true,
        model: {
          config: {
            access_token_signing: true,
            access_token_upstream_header: '',
            access_token_keyset: 'kong',
            channel_token_signing: false,
          },
        },
      })
      expectNoKeysetError('access')
    })

    it('flags the channel keyset when channel preconditions are met', () => {
      mountForm({
        isEditing: true,
        model: {
          config: {
            access_token_signing: false,
            channel_token_signing: true,
            channel_token_upstream_header: 'X-Channel-Token:Bearer',
            channel_token_keyset: 'kong',
          },
        },
      })
      expectKeysetError('channel')
      keysetInput('channel').parents('.k-input').find('.help-text')
        .should('contain.text', 'Channel token signing')
        .and('contain.text', 'Channel token upstream header')
    })
  })

  describe('Field ordering via bundles', () => {
    it('hoists access signing + upstream_header above keyset', () => {
      mountForm()

      cy.get([
        '[data-testid="ff-config.access_token_signing"]',
        '[data-testid="ff-config.access_token_upstream_header"]',
        '[data-testid="ff-config.access_token_keyset"]',
      ].join(', ')).then(($els) => {
        const ids = [...$els].map(el => el.getAttribute('data-testid'))
        expect(ids).to.deep.equal([
          'ff-config.access_token_signing',
          'ff-config.access_token_upstream_header',
          'ff-config.access_token_keyset',
        ])
      })
    })

    it('hoists channel signing + upstream_header above keyset', () => {
      mountForm()

      cy.get([
        '[data-testid="ff-config.channel_token_signing"]',
        '[data-testid="ff-config.channel_token_upstream_header"]',
        '[data-testid="ff-config.channel_token_keyset"]',
      ].join(', ')).then(($els) => {
        const ids = [...$els].map(el => el.getAttribute('data-testid'))
        expect(ids).to.deep.equal([
          'ff-config.channel_token_signing',
          'ff-config.channel_token_upstream_header',
          'ff-config.channel_token_keyset',
        ])
      })
    })
  })

  describe('Kong Manager', () => {
    it('never flags the keyset even when Konnect preconditions would trigger', () => {
      mountForm({ app: 'kongManager' })
      expectNoKeysetError('access')
      expectNoKeysetError('channel')
    })

    it('does not flag a non-URL keyset on Kong Manager edit', () => {
      mountForm({
        app: 'kongManager',
        isEditing: true,
        model: {
          config: {
            access_token_signing: true,
            access_token_upstream_header: 'Authorization:Bearer',
            access_token_keyset: 'kong',
            channel_token_signing: false,
          },
        },
      })
      expectNoKeysetError('access')
    })
  })
})
