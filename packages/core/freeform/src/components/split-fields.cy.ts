
import { defineComponent, h, nextTick, ref } from 'vue'
import { KCollapse } from '@kong/kongponents'
import Form from './Form.vue'
import ObjectField from './ObjectField.vue'
import { useRevealOpen } from '../composables'
import type { FormSchema } from '../form-schema'
import type { FieldError } from '../types'
import type { RevealOptions, RevealResult } from '../composables'

// `config` split the way entities-plugins' CommonForm does it: one record shows the
// default fields, another one in a collapsed section shows the advanced ones, each
// leaving out the other's fields with `omit`. `legacy_key` is left out by both.
const schema: FormSchema = {
  type: 'record',
  fields: [{
    config: {
      type: 'record',
      required: true,
      fields: [
        { host: { type: 'string' } },
        { timeout: { type: 'integer' } },
        { redis: { type: 'record', fields: [{ host: { type: 'string' } }] } },
        { legacy_key: { type: 'string' } },
      ],
    },
  }],
}

const data = { config: { host: 'a', timeout: 1, redis: { host: 'localhost' }, legacy_key: 'x' } }

/** A collapsed section that opens for a reveal, as `AdvancedFields` does */
const AdvancedSection = defineComponent({
  setup(_, { slots }) {
    const collapsed = ref(true)
    const root = ref<{ $el: Element } | null>(null)
    useRevealOpen(() => root.value?.$el, () => {
      collapsed.value = false
    })
    return () => h(KCollapse, {
      ref: root,
      modelValue: collapsed.value,
      'onUpdate:modelValue': (value: boolean) => {
        collapsed.value = value
      },
      triggerLabel: 'Advanced',
      'data-testid': 'advanced-section',
    }, slots)
  },
})

type FormApi = {
  reveal: (path: string, options?: RevealOptions) => Promise<RevealResult | null>
  unmatchedErrors: FieldError[]
}

function mountSplitForm(errors: FieldError[] = []) {
  let form: FormApi | undefined
  cy.mount(() => h(Form, { schema, data, errors, ref: (instance: unknown) => {
    form = instance as FormApi
  } }, {
    default: () => [
      h(ObjectField, { name: 'config', asChild: true, omit: ['timeout', 'redis', 'legacy_key'] }),
      h(AdvancedSection, null, {
        default: () => h(ObjectField, { name: 'config', asChild: true, omit: ['host', 'legacy_key'] }),
      }),
    ],
  }))
  return () => form!
}

describe('Fields split across records with omit', () => {
  it('matches an error only when a record renders its field', () => {
    const errors = [
      { path: 'config.host', message: 'invalid hostname' },
      { path: 'config.timeout', message: 'must be positive' },
      { path: 'config.legacy_key', message: 'unknown field' },
    ]
    const form = mountSplitForm(errors)

    cy.getTestId('ff-field-errors-config.host').should('have.text', 'invalid hostname')
    // Rendered in the collapsed section, so shown once it opens
    cy.getTestId('ff-field-errors-config.timeout').should('exist')
    // Both records leave it out: no field shows it, so the host gets it
    cy.then(() => form().unmatchedErrors).should('deep.equal', [errors[2]])
  })

  it('matches an error again once the field that renders it mounts', () => {
    const error = { path: 'config.timeout', message: 'must be positive' }
    const showAdvanced = ref(false)
    let form: FormApi | undefined
    // A container that unmounts its content, like a tab with `v-if`
    cy.mount(() => h(Form, { schema, data, errors: [error], ref: (instance: unknown) => {
      form = instance as FormApi
    } }, {
      default: () => [
        h(ObjectField, { name: 'config', asChild: true, omit: ['timeout', 'redis', 'legacy_key'] }),
        showAdvanced.value
          ? h(ObjectField, { name: 'config', asChild: true, omit: ['host', 'legacy_key'] })
          : null,
      ],
    }))

    cy.then(() => form!.unmatchedErrors).should('deep.equal', [error])
    cy.then(() => {
      showAdvanced.value = true
      return nextTick()
    })
    cy.getTestId('ff-field-errors-config.timeout').should('have.text', 'must be positive')
    cy.then(() => form!.unmatchedErrors).should('deep.equal', [])
  })

  it('opens the collapsed section to reveal a field inside it', () => {
    const form = mountSplitForm()
    cy.getTestId('ff-config.timeout').should('not.be.visible')

    cy.then(() => form().reveal('config.timeout', { duration: 0 }))
      .should('deep.equal', { path: 'config.timeout', exact: true })
    cy.getTestId('ff-config.timeout').should('be.visible').and('have.focus')
  })

  it('leaves the section collapsed for a field outside it', () => {
    const form = mountSplitForm()

    cy.then(() => form().reveal('config.host', { duration: 0 }))
      .should('deep.equal', { path: 'config.host', exact: true })
    cy.getTestId('ff-config.timeout').should('not.be.visible')
  })

  it('opens the section and then the record inside it', () => {
    const form = mountSplitForm()
    // Collapse the record while the section stays collapsed
    cy.getTestId('ff-object-toggle-btn-config.redis').click({ force: true })
    cy.getTestId('ff-config.redis.host').should('not.exist')

    cy.then(() => form().reveal('config.redis.host', { duration: 0 }))
      .should('deep.equal', { path: 'config.redis.host', exact: true })
    cy.getTestId('ff-config.redis.host').should('be.visible').and('have.focus')
  })
})
