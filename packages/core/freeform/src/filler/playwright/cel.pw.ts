import { test, expect } from '@playwright/experimental-ct-vue'
import { createFiller } from './create-filler'
import CelFormWrapper from '../fixtures/CelFormWrapper.vue'
import { acl, condition, expression, parsePayload, schema } from '../fixtures/cel'

for (const enabled of [false, true]) {
  test(`fills, replaces and clears expression, condition and ACL inputs with CEL ${enabled ? 'on' : 'off'}`, async ({ mount, page }) => {
    await mount(CelFormWrapper, { props: { enabled } })
    const filler = createFiller(page, schema)
    const conditionValue = enabled ? condition : condition.replaceAll('\n', '')
    const payload = page.getByTestId('payload')
    const assertField = async (field: string, value: unknown) => {
      await expect.poll(async () => {
        const data = parsePayload(await payload.innerText())
        return field.split('.').reduce((parent, key) => parent?.[key], data)
      }).toEqual(value)
    }

    await filler.fillField('expressions.minute', expression)
    await assertField('expressions.minute', expression)
    await filler.fillField('condition', conditionValue)
    await assertField('condition', conditionValue)

    // The handlers are the per-control entry points; `fillField` picks one from the rendered control.
    const fillRow = enabled ? filler.handlers.fillCel : filler.handlers.fillString
    for (const name of ['allow_when', 'deny_when']) {
      await filler.fillField(`config.${name}`, [acl, 'true'])
      await assertField(`config.${name}`, [acl, 'true'])
      await fillRow({ page, fieldKey: `config.${name}.0`, fieldSchema: { type: 'string' }, value: 'false' })
      await assertField(`config.${name}`, ['false', 'true'])
      await fillRow({ page, fieldKey: `config.${name}.0`, fieldSchema: { type: 'string' }, value: null })
      await assertField(`config.${name}`, [null, 'true'])
    }

    await filler.fillField('expressions.minute', '2')
    await assertField('expressions.minute', '2')
    await filler.fillField('condition', 'false')
    await assertField('condition', 'false')
    await filler.fillField('expressions.minute', expression)
    await filler.fillField('expressions.minute', '')
    await assertField('expressions.minute', null)
    await filler.fillField('condition', conditionValue)
    await filler.fillField('condition', undefined)
    await assertField('condition', null)
  })
}

for (const enabled of [false, true]) {
  for (const preopened of [false, true]) {
    test(`commits expression edits on blur with CEL ${enabled ? 'on' : 'off'} and the editor ${preopened ? 'expanded' : 'collapsed'}`, async ({ mount, page }) => {
      await mount(CelFormWrapper, { props: { enabled, preopened, updateOnChange: true } })
      const filler = createFiller(page, schema)
      const payload = page.getByTestId('payload')
      const assertExpression = async (value: string | null) => {
        await expect.poll(async () => parsePayload(await payload.innerText()).expressions?.minute).toEqual(value)
      }

      await filler.fillField('expressions.minute', expression)
      await assertExpression(expression)
      await expect(page.getByTestId('ff-expressions.minute')).toHaveJSProperty('tagName', enabled ? 'DIV' : 'TEXTAREA')
      await filler.fillField('expressions.minute', '2')
      await assertExpression('2')
      for (const empty of ['', null, undefined]) {
        await filler.fillField('expressions.minute', expression)
        await filler.fillField('expressions.minute', empty)
        await assertExpression(null)
      }

      const conditionValue = enabled ? condition : condition.replaceAll('\n', '')
      await filler.fillField('condition', conditionValue)
      await expect.poll(async () => parsePayload(await payload.innerText()).condition).toEqual(conditionValue)
      await filler.fillField('condition', null)
      await expect.poll(async () => parsePayload(await payload.innerText()).condition).toBeNull()
    })
  }
}
