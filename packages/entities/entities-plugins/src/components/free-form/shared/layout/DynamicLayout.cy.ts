import { h } from 'vue'
import DynamicLayout from './DynamicLayout.vue'
import { useProvideFreeFormPluginLayout } from './provider'

import type { FreeFormPluginData } from '../../../../types/plugins/free-form'
import type { PluginFormLayoutComponent, PluginFormLayoutProps } from './provider'
import type { Slots } from 'vue'

type DynamicLayoutMountProps = PluginFormLayoutProps<FreeFormPluginData> & {
  formSchema: any
  formModel: Record<string, any>
}

const createBaseSchema = () => ({
  type: 'record',
  fields: [
    {
      config: {
        type: 'record',
        fields: [],
      },
    },
  ],
})

const createFormSchema = () => ({
  fields: [
    {
      model: 'enabled',
      type: 'switch',
      default: true,
    },
    {
      type: 'selectionGroup',
      fields: [
        {
          label: 'Global',
          description: 'Plugin will apply to all requests',
        },
        {
          label: 'Scoped',
          description: 'Specific Services, Routes, Consumers, and/or Consumer Groups',
          fields: [],
        },
      ],
    },
  ],
})

const createLayoutProps = (overrides: Partial<DynamicLayoutMountProps> = {}): DynamicLayoutMountProps => ({
  schema: createBaseSchema() as any,
  formSchema: createFormSchema(),
  model: {
    enabled: true,
    config: {},
  },
  formModel: {
    enabled: true,
  },
  onFormChange: cy.spy().as('onFormChange'),
  pluginName: 'test-plugin',
  isEditing: false,
  ...overrides,
})

const InjectedLayout = {
  name: 'InjectedLayout',
  props: {
    pluginName: {
      type: String,
      required: true,
    },
    isEditing: {
      type: Boolean,
      required: true,
    },
  },
  setup(props: { pluginName: string, isEditing: boolean }, { slots }: { slots: Slots }) {
    return () => h('section', { 'data-testid': 'injected-layout' }, [
      h('span', { 'data-testid': 'injected-plugin-name' }, props.pluginName),
      h('span', { 'data-testid': 'injected-editing-state' }, String(props.isEditing)),
      slots.default?.(),
      slots['plugin-config-description']?.({ description: 'forwarded slot prop' }),
    ])
  },
} as PluginFormLayoutComponent

describe('<DynamicLayout />', () => {
  it('falls back to StandardLayout when no layout is provided', () => {
    cy.mount(DynamicLayout as any, {
      props: createLayoutProps(),
      slots: {
        default: () => h('div', { 'data-testid': 'default-config-slot' }, 'Plugin config fields'),
      },
    })

    cy.get('.ff-standard-layout').should('exist')
    cy.get('[data-testid="form-section-plugin-config"]').should('contain.text', 'Plugin config fields')
    cy.get('[data-testid="default-config-slot"]').should('exist')
  })

  it('renders the provided layout from useProvideFreeFormPluginLayout', () => {
    const Host = {
      name: 'DynamicLayoutHost',
      setup() {
        useProvideFreeFormPluginLayout(InjectedLayout)

        return () => h(DynamicLayout as any, createLayoutProps({
          pluginName: 'provided-plugin',
          isEditing: true,
        }))
      },
    }

    cy.mount(Host as any)

    cy.get('[data-testid="injected-layout"]').should('exist')
    cy.get('.ff-standard-layout').should('not.exist')
    cy.get('[data-testid="injected-plugin-name"]').should('contain.text', 'provided-plugin')
    cy.get('[data-testid="injected-editing-state"]').should('contain.text', 'true')
  })

  it('forwards named slots and slot props through the provided layout', () => {
    const Host = {
      name: 'DynamicLayoutSlotHost',
      setup() {
        useProvideFreeFormPluginLayout(InjectedLayout)

        return () => h(DynamicLayout as any, createLayoutProps(), {
          default: () => h('div', { 'data-testid': 'forwarded-default-slot' }, 'Default slot content'),
          'plugin-config-description': ({ description }: { description: string }) => h(
            'span',
            { 'data-testid': 'forwarded-named-slot' },
            description,
          ),
        })
      },
    }

    cy.mount(Host as any)

    cy.get('[data-testid="forwarded-default-slot"]').should('contain.text', 'Default slot content')
    cy.get('[data-testid="forwarded-named-slot"]').should('contain.text', 'forwarded slot prop')
  })
})
