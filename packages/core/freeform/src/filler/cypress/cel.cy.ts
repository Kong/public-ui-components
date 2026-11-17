import { createFiller } from './create-filler'
import { fillExpression } from './handlers/expression'
import { defineAsyncComponent } from 'vue'
import CelFormWrapper from '../fixtures/CelFormWrapper.vue'
import { acl, condition, expression, parsePayload, schema } from '../fixtures/cel'

function assertField(path: string, value: unknown) {
  cy.getTestId('payload').should(($output) => {
    const data = parsePayload($output.text())
    expect(path.split('.').reduce((parent, key) => parent?.[key], data)).to.deep.equal(value)
  })
}

for (const updateOnChange of [false, true]) {
  it(`routes explicit CEL fields through fillExpression with updateOnChange ${updateOnChange}`, () => {
    cy.mount(CelFormWrapper, { props: { enabled: false, updateOnChange } })
    const filler = createFiller(schema, { fillExpression: cy.spy(fillExpression).as('fillExpression') })

    // A schema CEL field has no expression twin container or Add expression button.
    cy.get('[data-expression-for="rule"]').should('not.exist')
    filler.fill({ rule: condition })
    assertField('rule', condition)
    cy.get('@fillExpression').should('have.been.calledWithMatch', { fieldKey: 'rule', fieldSchema: { type: 'cel' } })
    filler.fillField('rule', 'false')
    assertField('rule', 'false')
    for (const empty of ['', null, undefined]) {
      filler.fillField('rule', condition)
      filler.fillField('rule', empty)
      assertField('rule', null)
    }
  })
}

for (const enabled of [false, true]) {
  it(`fills, replaces and clears expression, condition and ACL inputs with CEL ${enabled ? 'on' : 'off'}`, () => {
    // Exercise cold editor loading beyond Cypress's default command timeout.
    cy.mount(CelFormWrapper, {
      props: { enabled },
      global: { stubs: enabled ? {
        MonacoEditor: defineAsyncComponent(async () => {
          await new Promise(resolve => setTimeout(resolve, 5500))
          // A distinct name keeps Vue Test Utils from stubbing the real editor again.
          return { ...(await import('@kong-ui-public/monaco-editor')).MonacoEditor, name: 'DelayedMonacoEditor' }
        }),
      } : {} },
    })
    const filler = createFiller(schema)
    const conditionValue = enabled ? condition : condition.replaceAll('\n', '')

    filler.fillField('expressions.minute', expression)
    assertField('expressions.minute', expression)
    filler.fillField('condition', conditionValue)
    assertField('condition', conditionValue)

    for (const name of ['allow_when', 'deny_when']) {
      filler.fillField(`config.${name}`, [acl, 'true'])
      assertField(`config.${name}`, [acl, 'true'])
      filler.handlers.fillString({ fieldKey: `config.${name}.0`, fieldSchema: { type: 'string' }, value: 'false' })
      assertField(`config.${name}`, ['false', 'true'])
      filler.handlers.fillString({ fieldKey: `config.${name}.0`, fieldSchema: { type: 'string' }, value: null })
      assertField(`config.${name}`, [null, 'true'])
    }

    filler.fillField('expressions.minute', '2')
    assertField('expressions.minute', '2')
    filler.fillField('condition', 'false')
    assertField('condition', 'false')
    filler.fillField('expressions.minute', expression)
    filler.fillField('expressions.minute', '')
    assertField('expressions.minute', null)
    filler.fillField('condition', conditionValue)
    filler.fillField('condition', undefined)
    assertField('condition', null)
  })
}

for (const enabled of [false, true]) {
  for (const preopened of [false, true]) {
    it(`commits expression edits on blur with CEL ${enabled ? 'on' : 'off'} and the editor ${preopened ? 'expanded' : 'collapsed'}`, () => {
      cy.mount(CelFormWrapper, { props: { enabled, preopened, updateOnChange: true } })
      const filler = createFiller(schema)
      filler.fillField('expressions.minute', expression)
      assertField('expressions.minute', expression)
      cy.getTestId('ff-expressions.minute').should('have.prop', 'tagName', enabled ? 'DIV' : 'TEXTAREA')
      filler.fillField('expressions.minute', '2')
      assertField('expressions.minute', '2')
      for (const empty of ['', null, undefined]) {
        filler.fillField('expressions.minute', expression)
        filler.fillField('expressions.minute', empty)
        assertField('expressions.minute', null)
      }

      const conditionValue = enabled ? condition : condition.replaceAll('\n', '')
      filler.fillField('condition', conditionValue)
      assertField('condition', conditionValue)
      filler.fillField('condition', null)
      assertField('condition', null)
    })
  }
}
