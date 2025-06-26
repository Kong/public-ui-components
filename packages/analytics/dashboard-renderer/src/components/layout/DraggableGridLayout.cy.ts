import { ref, type ComponentPublicInstance } from 'vue'
import { dragTile } from '../../test-utils'
import DraggableGridLayout, { type DraggableGridLayoutExpose } from './DraggableGridLayout.vue'
import type { GridTile } from 'src/types'

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
      },
    })

    cy.get('.grid-stack').should('be.visible')
    cy.get('.grid-stack-item').should('have.length', 2)
  })

  it('should render tiles with correct attributes', () => {
    cy.mount(DraggableGridLayout, {
      props: {
        tiles: mockTiles,
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
      },
    }).then(({ component }) => {
      // Access the exposed method
      (component as ComponentPublicInstance<DraggableGridLayoutExpose<string>>).removeWidget('1')

      // Check if the widget was removed
      cy.getTestId('grid-stack-item-1').should('not.exist')
      cy.get('.grid-stack-item').should('have.length', 1)
    })
  })

  it('should add new tile when tiles prop length increases', () => {

    const tilesRef = ref(mockTiles)

    cy.mount(DraggableGridLayout, {
      props: {
        tiles: tilesRef.value,
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
})
