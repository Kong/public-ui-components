import { calculateRowDefs } from './grid-utils'
import { describe, it, expect } from 'vitest'

describe('calculateRowDefs', () => {
  it('auto-fits rows', () => {
    expect(calculateRowDefs(2, 100, [
      {
        layout: {
          position: {
            col: 0,
            row: 0,
          },
          size: {
            rows: 1,
            cols: 2,
            fitToContent: true,
          },
        },
        id: 'blah',
        meta: {},
      },
      {
        layout: {
          position: {
            col: 3,
            row: 0,
          },
          size: {
            rows: 1,
            cols: 2,
            fitToContent: true,
          },
        },
        id: 'blah',
        meta: {},
      },
      {
        layout: {
          position: {
            col: 0,
            row: 1,
          },
          size: {
            rows: 1,
            cols: 4,
          },
        },
        id: 'blah',
        meta: {},
      },
    ])).toEqual(['auto', '100px'])
  })

  it("doesn't auto-fit if a tile spans multiple rows", () => {
    expect(calculateRowDefs(2, 100, [
      {
        layout: {
          position: {
            col: 0,
            row: 0,
          },
          size: {
            rows: 2,
            cols: 2,
            fitToContent: true,
          },
        },
        id: 'blah',
        meta: {},
      },
      {
        layout: {
          position: {
            col: 3,
            row: 0,
          },
          size: {
            rows: 1,
            cols: 2,
            fitToContent: true,
          },
        },
        id: 'blah',
        meta: {},
      },
    ])).toEqual(['100px', '100px'])
  })
})
