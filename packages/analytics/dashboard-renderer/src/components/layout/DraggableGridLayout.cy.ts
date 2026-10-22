import type { ComponentPublicInstance } from 'vue'
import type { GridTile } from 'src/types'
import type { DraggableGridLayoutExpose } from './DraggableGridLayout.vue'

import { h, ref } from 'vue'
import { dragTile } from '../../test-utils'
import DraggableGridLayout from './DraggableGridLayout.vue'
import { KUI_SPACE_50 } from '@kong/design-tokens'
import { CELLS_PER_ROW, DEFAULT_TILE_HEIGHT } from '../../constants'

describe('<DraggableGridLayout />', () => {
  const mockTiles: Array<GridTile<string>> = [
    {
      id: '1',
      layout: {
        position: { col: 0, row: 0 },
        size: { cols: 2, rows: 2 },
      },
      meta: 'Metadata for tile 1',
    },
    {
      id: '2',
      layout: {
        position: { col: 2, row: 0 },
        size: { cols: 2, rows: 2 },
      },
      meta: 'Metadata for tile 2',
    },
  ]

  it('should render grid container and tiles', () => {
    cy.mount(DraggableGridLayout, {
      props: {
        tiles: mockTiles,
        editable: true,
      },
    })

    cy.get('.grid-stack').should('be.visible')
    cy.get('.grid-stack-item').should('have.length', 2)
  })

  it('should render tiles with correct attributes', () => {
    cy.mount(DraggableGridLayout, {
      props: {
        tiles: mockTiles,
        editable: true,
      },
    })

    cy.get('[data-id="1"]')
      .should('have.attr', 'gs-x', '0')
      .and('have.attr', 'gs-y', '0')
      .and('have.attr', 'gs-w', '2')
      .and('have.attr', 'gs-h', '2')

    cy.get('[data-id="2"]')
      .should('have.attr', 'gs-x', '2')
      .and('have.attr', 'gs-y', '0')
      .and('have.attr', 'gs-w', '2')
      .and('have.attr', 'gs-h', '2')
  })

  it('should emit update-tiles event when tile is moved', () => {
    cy.mount(DraggableGridLayout, {
      props: {
        tiles: mockTiles,
        editable: true,
      },
      attrs: {
        onUpdateTiles: cy.spy().as('updateTilesSpy'),
      },
    })

    dragTile('grid-stack-item-1', 'grid-stack-item-2', '.grid-stack-item-content')

    cy.get('@updateTilesSpy').should('have.been.called')
  })

  it('should remove widget when removeWidget is called', () => {
    cy.mount(DraggableGridLayout, {
      props: {
        tiles: mockTiles,
        editable: true,
      },
    }).then(({ component }) => {
      // Access the exposed method
      (component as ComponentPublicInstance<DraggableGridLayoutExpose<string>>).removeWidget('1')

      // Check if the widget was removed
      cy.getTestId('grid-stack-item-1').should('not.exist')
      cy.get('.grid-stack-item').should('have.length', 1)
    })
  })

  it('should initialize GridStack with the columns prop', () => {
    cy.mount(DraggableGridLayout, {
      props: {
        tiles: mockTiles,
        editable: true,
        columns: 12,
      },
    })

    cy.get('.grid-stack').should('have.class', 'gs-12')
  })

  it('should default to 6 columns when columns prop is not set', () => {
    cy.mount(DraggableGridLayout, {
      props: {
        tiles: mockTiles,
        editable: true,
      },
    })

    cy.get('.grid-stack').should('have.class', 'gs-6')
  })

  it('should add new tile when tiles prop length increases', () => {

    const tilesRef = ref(mockTiles)

    cy.mount(DraggableGridLayout, {
      props: {
        tiles: tilesRef.value,
        editable: true,
      },
    }).then(() => {

      tilesRef.value.push({
        id: '3',
        layout: {
          position: { col: 4, row: 0 },
          size: { cols: 2, rows: 2 },
        },
        meta: 'Metadata for tile 3',
      })
      cy.get('.grid-stack-item').should('have.length', 3)
      cy.getTestId('grid-stack-item-3').should('exist')
    })
  })

  describe('fit to content', () => {
    // Row 0 is all fit tiles, row 1 is a regular full width tile
    const fitTiles = (): Array<GridTile<string>> => [
      { id: '1', layout: { position: { col: 0, row: 0 }, size: { cols: 3, rows: 1, fit_to_content: true } } },
      { id: '2', layout: { position: { col: 3, row: 0 }, size: { cols: 3, rows: 1, fit_to_content: true } } },
      { id: '3', layout: { position: { col: 0, row: 1 }, size: { cols: 6, rows: 1 } } },
    ]

    const contentHeight = ref(50)

    // GridStack rounds the content height plus the tile's top/bottom margin up to whole cells
    const cellsFor = (contentPx: number) => Math.ceil((contentPx + parseInt(KUI_SPACE_50, 10)) / (DEFAULT_TILE_HEIGHT / CELLS_PER_ROW))

    const mountLayout = (tiles: Array<GridTile<string>>, editable = false) => cy.mount(DraggableGridLayout, {
      props: { tiles, editable, onUpdateTiles: cy.spy().as('updateTilesSpy') },
      slots: {
        tile: ({ fitToContent }: { fitToContent: boolean }) => h('div', {
          style: { height: fitToContent ? `${contentHeight.value}px` : '100%' },
        }),
      },
    })

    beforeEach(() => {
      contentHeight.value = 50
      cy.viewport(1200, 800)
    })

    it('renders a static grid in view mode', () => {
      mountLayout(fitTiles())

      cy.get('.grid-stack').should('have.class', 'grid-stack-static')
    })

    it('sizes a row of fit tiles to their content', () => {
      mountLayout(fitTiles())

      cy.getTestId('grid-stack-item-1').should('have.attr', 'gs-h', `${cellsFor(50)}`)
      cy.getTestId('grid-stack-item-2').should('have.attr', 'gs-h', `${cellsFor(50)}`)
      // The regular tile below moves up under the shorter row
      cy.getTestId('grid-stack-item-3')
        .should('have.attr', 'gs-y', `${cellsFor(50)}`)
        .and('have.attr', 'gs-h', `${CELLS_PER_ROW}`)
    })

    it('resizes fit tiles when their content changes', () => {
      mountLayout(fitTiles())

      cy.getTestId('grid-stack-item-1').should('have.attr', 'gs-h', `${cellsFor(50)}`)
      cy.then(() => {
        contentHeight.value = 120
      })
      cy.getTestId('grid-stack-item-1').should('have.attr', 'gs-h', `${cellsFor(120)}`)
      cy.getTestId('grid-stack-item-3').should('have.attr', 'gs-y', `${cellsFor(120)}`)
    })

    it('keeps the full row height when a fit tile shares its row with a regular tile', () => {
      const tiles = fitTiles()
      delete tiles[1].layout.size.fit_to_content
      mountLayout(tiles)

      cy.getTestId('grid-stack-item-1').should('have.attr', 'gs-h', `${CELLS_PER_ROW}`)
      cy.getTestId('grid-stack-item-3').should('have.attr', 'gs-y', `${CELLS_PER_ROW}`)
    })

    it('fits a row once its regular tile is removed', () => {
      const tiles = fitTiles()
      delete tiles[1].layout.size.fit_to_content
      mountLayout(tiles).then(({ wrapper }) => {
        cy.getTestId('grid-stack-item-1').should('have.attr', 'gs-h', `${CELLS_PER_ROW}`)
        cy.then(() => wrapper.setProps({ tiles: tiles.filter(t => t.id !== '2') }))
        cy.getTestId('grid-stack-item-1').should('have.attr', 'gs-h', `${cellsFor(50)}`)
      })
    })

    it('ignores fit_to_content while editing', () => {
      mountLayout(fitTiles(), true)

      // GridStack omits gs-h for a 1 cell tile, so check the rendered height of the full row instead
      cy.getTestId('grid-stack-item-1').should($el => {
        expect($el[0].getBoundingClientRect().height).to.be.closeTo(DEFAULT_TILE_HEIGHT, 1)
      })
    })

    it('keeps fit_to_content when a tile is dragged', () => {
      mountLayout(fitTiles(), true)

      dragTile('grid-stack-item-1', 'grid-stack-item-2', '.grid-stack-item-content')

      cy.get('@updateTilesSpy').should((spy: any) => {
        const moved = spy.lastCall.args[0].find((t: GridTile<string>) => t.id === '1')
        expect(moved.layout.size.fit_to_content).to.equal(true)
      })
    })
  })

  describe('view mode', () => {
    beforeEach(() => {
      cy.viewport(1200, 800)
    })

    it('moves tiles when their layout changes', () => {
      cy.mount(DraggableGridLayout, { props: { tiles: mockTiles } }).then(({ wrapper }) => {
        const moved = mockTiles.map(t => t.id === '2'
          ? { ...t, layout: { ...t.layout, position: { col: 0, row: 2 } } }
          : t)

        cy.then(() => wrapper.setProps({ tiles: moved }))
        cy.getTestId('grid-stack-item-2')
          .should('have.attr', 'gs-x', '0')
          .and('have.attr', 'gs-y', `${2 * CELLS_PER_ROW}`)
      })
    })

    it('removes tiles from the grid when they are removed from props', () => {
      const stacked: Array<GridTile<string>> = [
        { id: '1', layout: { position: { col: 0, row: 0 }, size: { cols: 6, rows: 1 } } },
        { id: '2', layout: { position: { col: 0, row: 1 }, size: { cols: 6, rows: 1 } } },
      ]

      cy.mount(DraggableGridLayout, { props: { tiles: stacked } }).then(({ wrapper }) => {
        cy.then(() => wrapper.setProps({ tiles: [stacked[1]] }))
        cy.get('.grid-stack-item').should('have.length', 1)
        // Only moves up if GridStack dropped tile 1 too
        cy.getTestId('grid-stack-item-2').should('have.attr', 'gs-y', '0')
      })
    })

    it('switches to a single column at narrow widths', () => {
      cy.viewport(600, 800)
      cy.mount(DraggableGridLayout, { props: { tiles: mockTiles } })

      cy.get('.grid-stack').should('have.class', 'gs-1')
      cy.getTestId('grid-stack-item-2').should('have.attr', 'gs-x', '0')
    })

    it('keeps the configured columns at wider widths', () => {
      cy.mount(DraggableGridLayout, { props: { tiles: mockTiles } })

      cy.get('.grid-stack').should('have.class', 'gs-6')
      cy.getTestId('grid-stack-item-2').should('have.attr', 'gs-x', '2')
    })
  })
})
