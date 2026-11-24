/* eslint-disable vue/one-component-per-file -- small harness components wrap the form */
import { defineComponent, h, ref } from 'vue'
import Form from './Form.vue'
import Field from './Field.vue'
import { defineRevealAdapter, updateModelValue } from '../composables'
import type { FormSchema } from '../form-schema'
import type { FieldError, RenderRules } from '../types'
import type { RevealContainerQuery, RevealResult } from '../composables'

const schema: FormSchema = {
  type: 'record',
  fields: [
    {
      first: {
        type: 'record',
        required: true,
        fields: [
          { host: { type: 'string' } },
          { extra: { type: 'string' } },
          { strategy: { type: 'string', one_of: ['local', 'redis'] } },
          {
            redis: {
              type: 'record',
              required: true,
              fields: [{ host: { type: 'string' } }],
            },
          },
        ],
      },
    },
    {
      second: {
        type: 'record',
        required: true,
        fields: [{ host: { type: 'string' } }, { proxy: { type: 'string' } }],
      },
    },
  ],
}

const renderRules: RenderRules = {
  dependencies: {
    'first.redis': ['first.strategy', 'redis'],
  },
}

/** Renders only the slot its `v-model` names, as a tab set does */
const Tabs = defineComponent({
  props: { modelValue: { type: String, required: true } },
  emits: ['update:modelValue'],
  setup(props, { slots }) {
    return () => h('div', slots[props.modelValue]?.())
  },
})

defineRevealAdapter(Tabs, {
  contentSlots: () => true,
  open: ({ vnode, slotName }) => updateModelValue(vnode, slotName),
})

/** Renders a field in its own template and has no reveal adapter */
const NoAdapter = defineComponent({
  setup() {
    return () => h('div', [h(Field, { name: 'second.proxy' })])
  },
})

/** What the test needs from the harness and the form's exposed API */
type Harness = {
  tab: string
  showExtra: boolean
  strategy: string
  form: {
    reveal: (path: string) => Promise<RevealResult | null>
    unmatchedErrors: FieldError[]
    getContainerErrors: (query: RevealContainerQuery) => FieldError[]
  }
}

const TabsHarness = defineComponent({
  props: { errors: { type: Array<FieldError>, required: true } },
  setup(props, { expose }) {
    const tab = ref('first')
    const showExtra = ref(false)
    const strategy = ref('redis')
    const form = ref()
    expose({ tab, showExtra, strategy, form })

    return () => h(Form, {
      ref: form,
      schema,
      renderRules,
      errors: props.errors,
      data: {
        first: { host: 'a', extra: 'b', strategy: strategy.value, redis: { host: '' } },
        second: { host: 'c', proxy: 'd' },
      },
    }, {
      default: () => [
        h(Field, { name: 'first.strategy' }),
        h(Tabs, { modelValue: tab.value, 'onUpdate:modelValue': (value: string) => (tab.value = value) }, {
          first: () => [
            h(Field, { name: 'first.host' }),
            // View state behind a plain `v-if`: the form learns these fields once they have shown
            showExtra.value
              ? h('div', [h(Field, { name: 'first.extra' }), h(Field, { name: 'first.redis' })])
              : null,
          ],
          second: () => [h(Field, { name: 'second.host' }), h(NoAdapter)],
        }),
      ],
    })
  },
})

function mountHarness(errors: FieldError[]) {
  cy.mount(TabsHarness, { props: { errors } }).then(({ wrapper }) => {
    cy.wrap(wrapper.vm as unknown as Harness).as('harness')
  })
}

function set(state: Partial<Pick<Harness, 'tab' | 'showExtra' | 'strategy'>>) {
  cy.get<Harness>('@harness').then(harness => Object.assign(harness, state))
}

function reveal(path: string) {
  return cy.get<Harness>('@harness').then(harness => cy.wrap(harness.form.reveal(path)))
}

describe('Reveal memory', () => {
  it('remembers a field a `v-if` took out and reveals where it was', () => {
    const error = { path: 'first.extra', message: 'invalid' }
    mountHarness([error])

    // Not shown yet: the form doesn't know it renders the field
    cy.get('@harness').its('form.unmatchedErrors').should('deep.equal', [error])

    set({ showExtra: true })
    cy.getTestId('ff-first.extra').should('be.visible')
    cy.get('@harness').its('form.unmatchedErrors').should('deep.equal', [])

    set({ showExtra: false })
    cy.getTestId('ff-first.extra').should('not.exist')
    cy.get('@harness').its('form.unmatchedErrors').should('deep.equal', [])
    // It sits in the containers of its anchor, `first.host`
    cy.get<Harness>('@harness').then(harness => harness.form.getContainerErrors({ component: Tabs, slotName: 'first' }))
      .should('deep.equal', [error])

    // From another tab, the reveal opens the anchor's tab and lands where the field was
    set({ tab: 'second' })
    cy.getTestId('ff-first.host').should('not.exist')
    reveal('first.extra').should('deep.equal', { path: 'first.extra', exact: false })
    cy.get('@harness').its('tab').should('equal', 'first')
    cy.getTestId('ff-first.host').should('be.visible')
  })

  it('remembers a field of a component with no adapter once it has shown', () => {
    const error = { path: 'second.proxy', message: 'must be a URL' }
    mountHarness([error])

    // The scan can't see into the component's own template
    cy.get('@harness').its('form.unmatchedErrors').should('deep.equal', [error])

    set({ tab: 'second' })
    cy.getTestId('ff-second.proxy').should('be.visible')
    cy.get('@harness').its('form.unmatchedErrors').should('deep.equal', [])

    set({ tab: 'first' })
    cy.getTestId('ff-second.proxy').should('not.exist')
    cy.get('@harness').its('form.unmatchedErrors').should('deep.equal', [])
    // It sits in the containers of its anchor, `second.host`
    cy.get<Harness>('@harness').then(harness => harness.form.getContainerErrors({ component: Tabs, slotName: 'second' }))
      .should('deep.equal', [error])
    cy.get<Harness>('@harness').then(harness => harness.form.getContainerErrors({ component: Tabs, slotName: 'first' }))
      .should('deep.equal', [])

    // Opening the anchor's tab mounts the field again, so the reveal lands on it
    reveal('second.proxy').should('deep.equal', { path: 'second.proxy', exact: true })
    cy.get('@harness').its('tab').should('equal', 'second')
    cy.getTestId('ff-second.proxy').should('have.focus')
  })

  it('leaves a remembered field alone once render rules hide it', () => {
    const error = { path: 'first.redis.host', message: 'required field missing' }
    mountHarness([error])

    set({ showExtra: true })
    cy.getTestId('ff-first.extra').should('be.visible')
    set({ showExtra: false })
    cy.getTestId('ff-first.extra').should('not.exist')
    cy.get('@harness').its('form.unmatchedErrors').should('deep.equal', [])

    // For the current data the field isn't there at all
    set({ strategy: 'local' })
    cy.get('@harness').its('form.unmatchedErrors').should('deep.equal', [error])
    set({ tab: 'second' })
    reveal('first.redis.host').should('equal', null)
    cy.get('@harness').its('tab').should('equal', 'second')
  })
})
