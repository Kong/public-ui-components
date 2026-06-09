import { describe, expect, it } from 'vitest'
import { patchRowAttrs } from './rowAttrs'

describe('patchRowAttrs', () => {
  it('applies class, style, and generic attributes while removing stale values', () => {
    const element = document.createElement('div')

    patchRowAttrs(element, {
      class: {
        active: true,
        hidden: false,
      },
      'data-testid': 'row-1',
      style: {
        backgroundColor: 'red',
        color: 'white',
      },
      title: 'Gateway service',
    })

    expect(element.className).toBe('active')
    expect(element.getAttribute('data-testid')).toBe('row-1')
    expect(element.getAttribute('title')).toBe('Gateway service')
    expect(element.style.backgroundColor).toBe('red')
    expect(element.style.color).toBe('white')

    patchRowAttrs(element, {
      class: ['selected', { active: false }],
      'aria-label': 'Gateway service row',
      style: {
        color: 'black',
      },
    })

    expect(element.classList.contains('active')).toBe(false)
    expect(element.classList.contains('selected')).toBe(true)
    expect(element.getAttribute('data-testid')).toBeNull()
    expect(element.getAttribute('title')).toBeNull()
    expect(element.getAttribute('aria-label')).toBe('Gateway service row')
    expect(element.style.backgroundColor).toBe('')
    expect(element.style.color).toBe('black')
  })
})
