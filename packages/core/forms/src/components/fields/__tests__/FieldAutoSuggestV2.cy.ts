import FieldAutoSuggestV2 from '../FieldAutoSuggestV2.vue'
import { v4 } from 'uuid'
import { FORMS_API_KEY, EMPTY_VALUE_PLACEHOLDER } from '../../../const'

const schema = {
  entity: 'services',
  inputValues: {
    fields: ['name', 'id'],
    primaryField: 'name',
  },
  labelField: 'name',
  model: 'service-id',
  disabled: false,
}

const generateMockServiceData = (idx: number) => {
  return {
    id: v4(),
    name: `test-service-${idx}`,
    'connect_timeout': 60000,
    'created_at': 1751534248,
    'enabled': true,
    'host': 'http.bin',
    'port': 443,
    'protocol': 'https',
    'read_timeout': 60000,
    'retries': 5,
    'updated_at': 1751534248,
    'write_timeout': 60000,
  }
}

const generateServices = (count: number, append?: ReturnType<typeof generateMockServiceData>) => {
  const ret: { data: any[], offset: string | null, next: string | null } = {
    data: [],
    offset: null,
    next: null,
  }
  if (count > 50) {
    ret.offset = 'next-page-offset'
    ret.next = `/services?offset=${ret.offset}`
  }

  ret.data.push(...Array.from({ length: count }).map((_, idx) => generateMockServiceData(idx)))

  if (append) {
    ret.data.push(append)
  }

  return {
    data: ret,
  }
}

const defaultGetOneReturn = generateMockServiceData(1)

const defaultAPIReturns = {
  getOneReturn: defaultGetOneReturn,
  getAllReturn: generateServices(99, defaultGetOneReturn),
  peekReturn: generateServices(49, defaultGetOneReturn),
}

describe.only('<FieldAutoSuggestV2 />', function() {
  let getOne: () => Promise<ReturnType<typeof generateMockServiceData>>
  let getAll: () => Promise<ReturnType<typeof generateServices>>
  let peek: () => Promise<ReturnType<typeof generateServices>>

  const createComponent = (overrideSchema = {}, { getOneReturn, getAllReturn, peekReturn } = defaultAPIReturns) => {
    getOne = cy.stub().as('getOne').resolves({ data: getOneReturn })
    getAll = cy.stub().as('getAll').resolves(getAllReturn)
    peek = cy.stub().as('peek').resolves(peekReturn)

    cy.mount(FieldAutoSuggestV2, {
      props: {
        model: {
          'service-id': null,
        },
        schema: {
          ...schema,
          ...overrideSchema,
        },
      },
      global: {
        provide: {
          [FORMS_API_KEY]: {
            getOne: getOne,
            getAllV2: getAll,
            peek: peek,
          },
        },
      },
    })
  }

  describe('initial fetch with suggestions less than 50 or equal records', () => {
    beforeEach(() => {
      createComponent()
    })

    it('should load all suggestions at once', () => {
      expect(peek).to.have.been.callCount(1)
    })

    it('should only perform inline search', () => {
      cy.getTestId('select-input').type('test-service-1')
      expect(getAll).to.have.been.callCount(0)
    })

    it('can perform inline search with uuid', () => {
      cy.getTestId('select-input').type(defaultGetOneReturn.id)
      expect(getAll).to.have.been.callCount(0)
      expect(getOne).to.have.been.callCount(0)
    })
  })

  describe('initial fetch with suggestions more than 50 records', () => {
    beforeEach(() => {
      const getOneReturn = {
        ...defaultGetOneReturn,
        name: null,
      } as any
      createComponent({}, {
        getOneReturn,
        getAllReturn: generateServices(49, getOneReturn),
        peekReturn: generateServices(99, getOneReturn),
      })
    })

    it('should load suggestions until reaching 50 records', () => {
      expect(peek).to.have.been.callCount(1)
    })

    it('should send request to the server for search', () => {
      cy.clock()
      cy.getTestId('select-input').click()
      cy.getTestId('select-input').type('test-service-1')
      // called on the edge trigger
      cy.tick(0).then(() => {
        expect(getAll).to.have.been.callCount(1)
      })

      cy.tick(500).then(() => {
        expect(getAll).to.have.been.callCount(2)
        cy.clock().then(clock => clock.restore())
      })
    })

    it('can perform online search with uuid', () => {
      cy.clock()
      cy.getTestId('select-input').click()
      cy.getTestId('select-input').type(defaultGetOneReturn.id)
      // The cypress.type puts text into the text input sequentially, so that the first request fired
      // from the input event is `getAll`, after the debounce time, the uuid is put into the text input box
      // now the exact fetch event is then fired.
      cy.tick(500).then(() => {
        expect(getOne).to.have.been.callCount(1)
        cy.get(`[data-testid="select-item-${defaultGetOneReturn.id}"]`).should('exist')
        cy.clock().then(clock => {
          clock.restore()
          cy.get(`[data-testid="select-item-${defaultGetOneReturn.id}"] button`).should('include.text', EMPTY_VALUE_PLACEHOLDER)
          cy.get(`[data-testid="select-item-${defaultGetOneReturn.id}"] button`).click()
          // The selected item without a label field should show the id instead of `—`.
          cy.get('.custom-selected-item-wrapper').should('contain.text', defaultGetOneReturn.id)
        })
      })
    })
  })

  describe('suggestions with name `-` as name', () => {
    it('can fetch and display the entity with name `-` correctly', () => {
      const getOneReturn = {
        ...defaultGetOneReturn,
        name: '-',
      }
      createComponent({}, {
        getOneReturn,
        getAllReturn: generateServices(49, getOneReturn),
        peekReturn: generateServices(99, getOneReturn),
      })
      cy.clock()
      cy.getTestId('select-input').click()
      cy.getTestId('select-input').type(getOneReturn.id)
      // The cypress.type puts text into the text input sequentially, so that the first request fired
      // from the input event is `getAll`, after the debounce time, the uuid is put into the text input box
      // now the exact fetch event is then fired.
      cy.tick(500).then(() => {
        expect(getOne).to.have.been.callCount(1)
        cy.get(`[data-testid="select-item-${getOneReturn.id}"]`).should('exist')
        cy.clock().then(clock => {
          clock.restore()
          cy.get(`[data-testid="select-item-${getOneReturn.id}"] button`).click()
          // The selected item without a label field should show the id instead of `–`.
          cy.get('.custom-selected-item-wrapper').should('contain.text', getOneReturn.name)
        })
      })
    })
  })
})
