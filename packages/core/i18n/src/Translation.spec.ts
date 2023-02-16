import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Translation, createI18nTComponent } from './index'
import useI18n, { createI18n } from './i18n'

const english = {
  global: {
    ok: 'Okay',
    default: 'See the news at {0}. There is a lot there.',
    named: '{greeting}, my name is {name}. And I am {occupation}. I want {amount}',
  },
}

const i18n = createI18n('en-us', english, true)

describe('TranslationComponent', () => {
  it('should render', () => {
    const wrapper = mount({
      components: { I18nT: createI18nTComponent(i18n) },

      setup: () => {
        return {
          i18n,
        }
      },
      template: `
        <i18n-t
          keypath="global.default"
        >
          <a href="https://google.com">Google</a>
        </i18n-t>
      `,
    })
    expect(wrapper.html()).toEqual('<span keypath="global.default" tag="span">See the news at <a href="https://google.com">Google</a>. There is a lot there.</span>')
  })
})

describe('Translation', () => {
  it('should render default slot', () => {
    const wrapper = mount({
      template: `
        <i18n-t
          keypath="global.default"
        >
          <a href="https://google.com">Google</a>
        </i18n-t>
      `,
    }, {
      global: {
        plugins: [[Translation, { i18n }]],
      },
    })
    expect(wrapper.html()).toEqual('<span keypath="global.default" tag="span">See the news at <a href="https://google.com">Google</a>. There is a lot there.</span>')
  })

  it('should render named slots in predefined tag', () => {
    const wrapper = mount({
      setup: () => {
        return {
          i18n: useI18n(),
        }
      },
      template: `
        <i18n-t
          tag="h1"
          keypath="global.named"
        >
        <template #greeting>
          <b>Morning</b>
        </template>

        <template #name>
          <i>Val</i>
        </template>

        <template #occupation>
          <i>Money Asker</i>
        </template>

        <template #amount>
          {{ i18n.formatNumber(1000, { style: 'currency', currency: 'USD' }) }}
        </template>

        </i18n-t>
      `,
    }, {
      global: {
        plugins: [[Translation, { i18n }]],
      },
    },
    )
    expect(wrapper.html()).toEqual('<h1 keypath="global.named" tag="h1"><b>Morning</b>, my name is <i>Val</i>. And I am <i>Money Asker</i>. I want $1,000.00</h1>')
  })
})
