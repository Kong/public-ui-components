import { describe, it, expect } from 'vitest'
import { h } from 'vue'
import { KTabs } from '@kong/kongponents'
import { flattenRevealTree, scanRevealTree } from '@kong-ui-public/freeform'
import FieldControl from './components/FieldControl.vue'
import './reveal-adapters'

describe('reveal adapters', () => {
  it('finds a `FieldControl` in an inactive tab', () => {
    const fields = flattenRevealTree(scanRevealTree(h(KTabs, {
      modelValue: '#first',
      tabs: [{ hash: '#first', title: 'First' }, { hash: '#second', title: 'Second' }],
    }, {
      'second-anchor': () => 'Second',
      second: () => [h(FieldControl, { name: 'config.principals', exclude: ['error_on_miss'] })],
    })))

    expect(fields.map(field => ({
      path: field.path,
      exclude: field.exclude,
      containers: field.containers.map(container => container.slotName),
    }))).toEqual([{ path: 'config.principals', exclude: ['error_on_miss'], containers: ['second'] }])
  })
})
