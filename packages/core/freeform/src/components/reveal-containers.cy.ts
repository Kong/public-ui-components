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
          { timeout: { type: 'integer' } },
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
        fields: [
          { host: { type: 'string' } },
          { proxy: { type: 'string' } },
          { opaque: { type: 'string' } },
          { level: { type: 'string', one_of: ['info', 'debug'] } },
          { debug_body: { type: 'boolean' } },
        ],
      },
    },
  ],
}

const renderRules: RenderRules = {
  dependencies: {
    'first.redis': ['first.strategy', 'redis'],
    'second.debug_body': ['second.level', 'debug'],
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

/** Renders its default slot only while not collapsed; its title always shows */
const Collapse = defineComponent({
  props: { modelValue: { type: Boolean, required: true } },
  emits: ['update:modelValue'],
  setup(props, { slots }) {
    return () => h('section', [slots.title?.(), props.modelValue ? null : slots.default?.()])
  },
})

defineRevealAdapter(Collapse, {
  contentSlots: slotName => slotName === 'default',
  open: ({ vnode }) => updateModelValue(vnode, false),
})

/** Renders a field in its own template, and its reveal adapter names it */
const Opaque = defineComponent({
  setup() {
    return () => h('div', [h(Field, { name: 'second.opaque' })])
  },
})

defineRevealAdapter(Opaque, {
  fields: () => ['second.opaque'],
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
  collapsed: boolean
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
    const collapsed = ref(true)
    const showExtra = ref(false)
    const strategy = ref('redis')
    const form = ref<Harness['form']>()
    expose({ tab, collapsed, showExtra, strategy, form })

    return () => h(Form, {
      ref: form,
      schema,
      renderRules,
      errors: props.errors,
      data: {
        first: { host: 'a', timeout: 0, extra: 'b', strategy: strategy.value, redis: { host: '' } },
        second: { host: 'c', proxy: 'd', opaque: 'e', level: 'info', debug_body: true },
      },
    }, {
      default: () => [
        h(Field, { name: 'first.strategy' }),
        h(Tabs, { key: 'groups', modelValue: tab.value, 'onUpdate:modelValue': (value: string) => (tab.value = value) }, {
          first: () => [
            h(Field, { name: 'first.host' }),
            h(Collapse, { key: 'advanced', modelValue: collapsed.value, 'onUpdate:modelValue': (value: boolean) => (collapsed.value = value) }, {
              // Reads the errors of its own content, as a count on a tab would
              title: () => h('span', { 'data-testid': 'advanced-count' }, form.value?.getContainerErrors({ component: Collapse, key: 'advanced' }).length ?? 0),
              default: () => [h(Field, { name: 'first.timeout' })],
            }),
            // View state behind a plain `v-if`: the form learns these fields once they have shown
            showExtra.value
              ? h('div', [h(Field, { name: 'first.extra' }), h(Field, { name: 'first.redis' })])
              : null,
          ],
          second: () => [
            h(Field, { name: 'second.host' }),
            h(NoAdapter),
            h(Opaque),
            h(Field, { name: 'second.level' }),
            // Shown by a render rule only while the level is "debug"
            h(Field, { name: 'second.debug_body' }),
          ],
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

function set(state: Partial<Pick<Harness, 'tab' | 'collapsed' | 'showExtra' | 'strategy'>>) {
  cy.get<Harness>('@harness').then(harness => Object.assign(harness, state))
}

function reveal(path: string) {
  return cy.get<Harness>('@harness').then(harness => cy.wrap(harness.form.reveal(path)))
}

function getContainerErrors(query: RevealContainerQuery) {
  return cy.get<Harness>('@harness').then(harness => harness.form.getContainerErrors(query))
}

describe('Closed containers', () => {
  it('matches the errors of the fields in closed containers', () => {
    const errors = [
      { path: 'first.timeout', message: 'too low' },
      { path: 'second.host', message: 'required field missing' },
      { path: 'second.opaque', message: 'invalid' },
      { path: 'third', message: 'not in the schema' },
    ]
    cy.window().then(win => cy.spy(win.console, 'warn').as('warn'))
    mountHarness(errors)

    cy.getTestId('ff-first.timeout').should('not.exist')
    cy.getTestId('ff-second.host').should('not.exist')
    cy.get('@harness').its('form.unmatchedErrors').should('deep.equal', [errors[3]])

    getContainerErrors({ component: Tabs, slotName: 'first' }).should('deep.equal', [errors[0]])
    getContainerErrors({ component: Tabs, slotName: 'second' }).should('deep.equal', [errors[1], errors[2]])
    getContainerErrors({ component: Tabs, key: 'groups' }).should('deep.equal', errors.slice(0, 3))
    getContainerErrors({ component: Tabs, key: 'other' }).should('deep.equal', [])
    getContainerErrors({ component: Collapse, key: 'advanced' }).should('deep.equal', [errors[0]])

    // The content reads the count while the form scans it, without a loop
    cy.getTestId('advanced-count').should('have.text', '1')
    cy.get('@warn').should('not.have.been.calledWithMatch', /recursive/i)
  })

  it('opens the containers on the way, outermost first, and focuses the field', () => {
    mountHarness([])
    set({ tab: 'second' })
    cy.getTestId('ff-first.host').should('not.exist')

    reveal('first.timeout').should('deep.equal', { path: 'first.timeout', exact: true })
    cy.get('@harness').its('tab').should('equal', 'first')
    cy.get('@harness').its('collapsed').should('equal', false)
    cy.getTestId('ff-first.timeout').should('have.focus')
  })

  it('finds the fields an adapter names before the component mounts', () => {
    const error = { path: 'second.opaque', message: 'invalid' }
    mountHarness([error])
    cy.getTestId('ff-second.opaque').should('not.exist')
    cy.get('@harness').its('form.unmatchedErrors').should('deep.equal', [])

    reveal('second.opaque').should('deep.equal', { path: 'second.opaque', exact: true })
    cy.get('@harness').its('tab').should('equal', 'second')
    cy.getTestId('ff-second.opaque').should('have.focus')
  })

  it('opens no container for a field render rules hide', () => {
    const error = { path: 'second.debug_body', message: 'must be off' }
    mountHarness([error])
    cy.get('@harness').its('form.unmatchedErrors').should('deep.equal', [error])

    reveal('second.debug_body').should('equal', null)
    cy.get('@harness').its('tab').should('equal', 'first')
  })

  it('lets a later reveal take over', () => {
    mountHarness([])
    set({ tab: 'second' })
    cy.get<Harness>('@harness')
      .then(harness => Promise.all([harness.form.reveal('second.opaque'), harness.form.reveal('first.timeout')]))
      .should('deep.equal', [null, { path: 'first.timeout', exact: true }])
    cy.get('@harness').its('tab').should('equal', 'first')
    cy.get('@harness').its('collapsed').should('equal', false)
  })
})

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
