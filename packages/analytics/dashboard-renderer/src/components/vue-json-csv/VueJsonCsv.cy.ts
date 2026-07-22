import VueJsonCsv from './VueJsonCsv.vue'

const DOWNLOADS_FOLDER = Cypress.config('downloadsFolder')
const CSV_DATA = [
  { requests: 206, tzOffset: '-08:00', timestamp: '2022-10-15 13:43:27' },
  { requests: 381, tzOffset: '-08:00', timestamp: '2022-12-15 06:00:53' },
  { requests: 648, tzOffset: '-08:00', timestamp: '2022-04-26 06:26:28' },
  { requests: 925, tzOffset: '-08:00', timestamp: '2022-04-10 10:28:46' },
  { requests: 134, tzOffset: '-08:00', timestamp: '2022-12-06 14:38:38' },
]
const LABELS = { timestamp: 'Timestamp', tzOffset: 'UtcOffset', requests: 'TotalRequests' }
const FIELDS = ['timestamp', 'tzOffset', 'requests']

describe('<VueJsonCsv />', () => {
  afterEach(() => {
    cy.then(() => {
      Cypress.vueWrapper?.unmount()
    })
  })

  it('filters and relabels data before emitting the default filename', () => {
    cy.mount(VueJsonCsv, {
      props: {
        data: CSV_DATA,
        labels: LABELS,
        fields: FIELDS,
        testing: true,
      },
    })

    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.getTestId('export-csv').click().then(() => {
      const started = Cypress.vueWrapper.emitted('export-started')
      const finished = Cypress.vueWrapper.emitted('export-finished')

      expect(started?.[0]?.[0]).to.have.length(CSV_DATA.length)
      expect(started?.[0]?.[0][0]).to.deep.equal({ Timestamp: CSV_DATA[0].timestamp, UtcOffset: CSV_DATA[0].tzOffset, TotalRequests: CSV_DATA[0].requests })
      expect(finished?.[0]).to.deep.equal(['report-data.csv'])
    })
  })

  it('emits a supplied filename unchanged', () => {
    cy.mount(VueJsonCsv, {
      props: {
        data: CSV_DATA,
        labels: LABELS,
        fields: FIELDS,
        testing: true,
        filename: 'custom-export.csv',
      },
    })

    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.getTestId('export-csv').click().then(() => {
      expect(Cypress.vueWrapper.emitted('export-finished')?.[0]).to.deep.equal(['custom-export.csv'])
    })
  })

  // Field names come from API-provided chart metadata, so __proto__ must remain CSV data instead of changing the exported row prototype.
  it('treats __proto__ as CSV data without changing the exported row prototype', () => {
    cy.mount(VueJsonCsv, {
      props: {
        data: [{ ['__proto__']: 'own-value', excluded: 'excluded-value' }],
        labels: { ['__proto__']: '__proto__' },
        fields: ['__proto__'],
        testing: true,
      },
    })

    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.getTestId('export-csv').click().then(() => {
      const exported = Cypress.vueWrapper.emitted('export-started')?.[0]?.[0][0]

      expect(Object.hasOwn(exported, '__proto__')).to.equal(true)
      expect(exported.__proto__).to.equal('own-value')
      expect(Object.hasOwn(exported, 'excluded')).to.equal(false)
      expect(Object.getPrototypeOf(exported)).to.equal(Object.prototype)
    })
  })

  it('writes a UTF-8 BOM, delimiter, and Excel separator', () => {
    cy.mount(VueJsonCsv, {
      props: {
        data: CSV_DATA,
        labels: LABELS,
        fields: FIELDS,
        delimiter: ';',
        separatorExcel: true,
        encoding: 'utf-8',
        filename: 'serializer-utf8.csv',
      },
    })

    cy.getTestId('export-csv').click()
    cy.readFile(`${DOWNLOADS_FOLDER}/serializer-utf8.csv`).should('match', /^\ufeffSEP=;\r\nTimestamp;UtcOffset;TotalRequests/)
  })

  it('uses the requested non-UTF-8 MIME encoding without a BOM or separator', () => {
    cy.window().then(win => {
      const NativeBlob = win.Blob

      cy.stub(win, 'Blob').callsFake(function(parts: BlobPart[], options?: BlobPropertyBag) {
        return new NativeBlob(parts, options)
      }).as('blob')
    })

    cy.mount(VueJsonCsv, {
      props: {
        data: CSV_DATA,
        labels: LABELS,
        fields: FIELDS,
        delimiter: '|',
        separatorExcel: false,
        encoding: 'utf-16le',
        filename: 'serializer-utf16le.csv',
      },
    })

    cy.getTestId('export-csv').click()
    cy.get('@blob').should('have.been.calledWithMatch', Cypress.sinon.match.any, { type: 'text/csv;charset=utf-16le' })
    cy.readFile(`${DOWNLOADS_FOLDER}/serializer-utf16le.csv`).should(contents => {
      expect(contents.startsWith('\ufeff')).to.equal(false)
      expect(contents.startsWith('SEP=')).to.equal(false)
      expect(contents).to.contain('Timestamp|UtcOffset|TotalRequests')
    })
  })
})
