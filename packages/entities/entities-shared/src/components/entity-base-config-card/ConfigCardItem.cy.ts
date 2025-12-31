import { h } from 'vue'
import composables from '../../composables'
import type { RecordItem } from '../../types'
import { ConfigurationSchemaType } from '../../types'
import ConfigCardItem from './ConfigCardItem.vue'


describe('<ConfigCardItem />', () => {
  const { i18n: { formatUnixTimeStamp, formatIsoDate } } = composables.useI18n()
  describe('Labels & Tooltips', () => {
    it('renders a label and value correctly', () => {
      const label = 'Cool Name'
      const val = 'Kai'
      const item: RecordItem = {
        key: 'name',
        label,
        value: val,
      }

      cy.mount(ConfigCardItem, {
        props: {
          item,
        },
      })

      cy.get('.config-card-details-row').should('be.visible')
      cy.getTestId(`${item.key}-label`).should('be.visible')
      cy.getTestId(`${item.key}-label`).should('contain.text', label)
      cy.getTestId(`${item.key}-plain-text`).should('be.visible')
      cy.getTestId(`${item.key}-plain-text`).should('contain.text', val)
      cy.getTestId(`${item.key}-label-tooltip`).should('not.exist')
    })

    it('renders a slim label and value correctly. Label and value each consume 50% of the row width.', () => {
      const label = 'Cool Name'
      const val = 'Kai'
      const item: RecordItem = {
        key: 'name',
        label,
        value: val,
      }

      cy.mount(ConfigCardItem, {
        props: {
          item,
          slim: true,
        },
      })

      cy.get('.config-card-details-row').should('be.visible')
      cy.getTestId(`${item.key}-label`).should('be.visible')
      cy.getTestId(`${item.key}-label`).should('contain.text', label)
      cy.getTestId(`${item.key}-plain-text`).should('be.visible')
      cy.getTestId(`${item.key}-plain-text`).should('contain.text', val)
      cy.getTestId(`${item.key}-label-tooltip`).should('not.exist')

      cy.get('.config-card-details-row').invoke('width').then((rowWidth) => {
        cy.getTestId(`${item.key}-label`).invoke('outerWidth').then((labelWidth) => {
          expect(labelWidth).to.be.closeTo(Number(rowWidth) / 2, 1)
        })
        cy.getTestId(`${item.key}-property-value`).invoke('outerWidth').then((valueWidth) => {
          expect(valueWidth).to.be.closeTo(Number(rowWidth) / 2, 1)
        })
      })
    })

    it('renders a label and truncated value correctly', () => {
      const label = 'Cool Name'
      const val = 'This is a really long value that should definitely be truncated.'
      const item: RecordItem = {
        key: 'name',
        label,
        value: val,
      }

      cy.mount(ConfigCardItem, {
        props: {
          item,
          slim: true,
          truncated: true,
        },
      })

      cy.get('.config-card-details-row').should('be.visible')
      cy.getTestId(`${item.key}-label`).should('be.visible')
      cy.getTestId(`${item.key}-label`).should('contain.text', label)
      cy.getTestId(`${item.key}-plain-text`).should('be.visible')
      cy.getTestId(`${item.key}-plain-text`).should('contain.text', val)
      cy.getTestId(`${item.key}-label-tooltip`).should('not.exist')

      cy.get('.attrs-data-text')
        .should('have.css', 'text-overflow', 'ellipsis')
        .and('have.css', 'overflow', 'hidden')
        .and('have.css', 'white-space', 'nowrap')
    })

    it('allows slotting label and value', () => {
      const slottedLabel = 'Cool Cat Name'
      const slottedValue = 'TK (The Awesome) Meowstersmith'
      const item: RecordItem = {
        type: ConfigurationSchemaType.LinkExternal,
        key: 'name',
        label: 'Name',
        value: 'TK Meowstersmith',
      }

      cy.mount(ConfigCardItem, {
        props: {
          item,
        },
        slots: {
          label: h('div', {}, slottedLabel),
          [item.key]: h('div', {}, slottedValue),
        },
      })

      cy.get('.config-card-details-row').should('be.visible')
      cy.getTestId(`${item.key}-label`).should('be.visible')
      cy.getTestId(`${item.key}-label`).should('contain.text', slottedLabel)
      cy.getTestId(`${item.key}-plain-text`).should('not.exist')
      cy.getTestId(`${item.key}-property-value`).should('contain.text', slottedValue)
      cy.getTestId(`${item.key}-label-tooltip`).should('not.exist')
    })

    it('renders a label and tooltip correctly', () => {
      const label = 'Cool Cat Name'
      const val = 'TK Meowstersmith'
      const tooltip = 'TK is awesome'
      const item: RecordItem = {
        key: 'name',
        label,
        tooltip,
        value: val,
      }

      cy.mount(ConfigCardItem, {
        props: {
          item,
        },
      })

      cy.get('.config-card-details-row').should('be.visible')
      cy.getTestId(`${item.key}-label`).should('be.visible')
      cy.getTestId(`${item.key}-label`).should('contain.text', label)
      cy.getTestId(`${item.key}-label-tooltip`).should('exist')
      cy.getTestId(`${item.key}-label-tooltip`).should('contain.text', tooltip)
    })

    it('allows slotting label tooltip', () => {
      const label = 'Cool Cat Name'
      const val = 'TK Meowstersmith'
      const slottedTooltip = 'TK is awesome'
      const item: RecordItem = {
        key: 'name',
        label,
        value: val,
      }

      cy.mount(ConfigCardItem, {
        props: {
          item,
        },
        slots: {
          'label-tooltip': h('div', {}, slottedTooltip),
        },
      })

      cy.get('.config-card-details-row').should('be.visible')
      cy.getTestId(`${item.key}-label`).should('be.visible')
      cy.getTestId(`${item.key}-label`).should('contain.text', label)
      cy.getTestId(`${item.key}-label-tooltip`).should('exist')
      cy.getTestId(`${item.key}-label-tooltip`).should('contain.text', slottedTooltip)
    })
  })

  describe('Value handling', () => {
    it('handles no value correctly', () => {
      const emptyValues = [null, undefined, '']

      emptyValues.forEach(val => {
        const item: RecordItem = {
          key: 'name',
          label: 'Name',
          value: val,
        }

        cy.mount(ConfigCardItem, {
          props: {
            item,
          },
        })

        cy.get('.config-card-details-row').should('be.visible')
        cy.getTestId(`${item.key}-no-value`).should('be.visible')
        cy.getTestId(`${item.key}-plain-text`).should('not.exist')
      })
    })

    it('renders a Date correctly when given a number', () => {
      const date = 1686245746
      const formattedVal = formatUnixTimeStamp(date)
      const item: RecordItem = {
        type: ConfigurationSchemaType.Date,
        key: 'created_at',
        label: 'Created At',
        value: date,
      }

      cy.mount(ConfigCardItem, {
        props: {
          item,
        },
      })

      cy.get('.config-card-details-row').should('be.visible')
      cy.getTestId(`${item.key}-date`).should('be.visible')
      cy.getTestId(`${item.key}-date`).should('contain.text', formattedVal)
    })

    it('renders a Date correctly when given a ISO date string', () => {
      const date = '2023-06-08T15:22:26Z'
      const formattedVal = formatIsoDate(date)
      const item: RecordItem = {
        type: ConfigurationSchemaType.Date,
        key: 'created_at',
        label: 'Created At',
        value: date,
      }

      cy.mount(ConfigCardItem, {
        props: {
          item,
        },
      })

      cy.get('.config-card-details-row').should('be.visible')
      cy.getTestId(`${item.key}-date`).should('be.visible')
      cy.getTestId(`${item.key}-date`).should('contain.text', formattedVal)
    })

    it('renders a JSON field correctly', () => {
      const obj: Record<string, string> = {
        name: 'TK Meowstersmith',
        species: 'Awesome cat',
        color: 'All black',
        awesome: 'true',
      }
      const item: RecordItem = {
        type: ConfigurationSchemaType.Json,
        key: 'cat_data',
        label: 'Cat Data',
        value: obj,
      }

      cy.mount(ConfigCardItem, {
        props: {
          item,
        },
      })

      cy.get('.config-card-details-row').should('be.visible')
      cy.getTestId(`${item.key}-json-content`).should('be.visible')

      for (const key in obj) {
        cy.getTestId(`${key}-label`).should('be.visible')
        cy.getTestId(`${key}-plain-text`).should('be.visible')
        cy.getTestId(`${key}-plain-text`).should('contain.text', obj[key])
      }
    })

    it('renders JSON text field correctly', () => {
      const obj: Record<string, string> = {
        name: 'TK Meowstersmith',
        species: 'Awesome cat',
        color: 'All black',
        awesome: 'true',
      }
      const item: RecordItem = {
        type: ConfigurationSchemaType.Text,
        key: 'cat_data',
        label: 'Cat Data',
        value: obj,
      }

      cy.mount(ConfigCardItem, {
        props: {
          item,
        },
      })

      cy.get('.config-card-details-row').should('be.visible')
      cy.getTestId(`${item.key}-json-code`).should('be.visible')
      cy.getTestId(`${item.key}-json-code`).should('contain.text', JSON.stringify(obj, null, 2))
    })

    it('renders a JSON Array field correctly', () => {
      const obj: Array<Record<string, string>> = [{
        name: 'TK Meowstersmith',
        species: 'Awesome cat',
        color: 'All black',
        awesome: 'true',
      }, {
        name: 'Sunny McMouser',
        species: 'Shiny cat',
        color: 'Calico - Tortoise Shell',
        awesome: 'true',
      }, {
        name: 'Harper Joy',
        species: 'Happy yappy cat',
        color: 'Tuxedo - Black & White',
        awesome: 'true',
      }]
      const item: RecordItem = {
        type: ConfigurationSchemaType.JsonArray,
        key: 'cat_data',
        label: 'Cat Data',
        value: obj,
      }

      cy.mount(ConfigCardItem, {
        props: {
          item,
        },
      })

      cy.get('.config-card-details-row').should('be.visible')
      cy.getTestId(`${item.key}-json-array-content`).should('be.visible')

      obj.forEach((item: Record<string, string>) => {
        for (const key in item) {
          if (key !== 'name') {
            cy.getTestId(`${key}-label`).should('be.visible')
            cy.getTestId(`${key}-plain-text`).should('be.visible')
            cy.getTestId(`${key}-plain-text`).should('contain.text', item[key])
          } else {
            // verify name is stripped out
            cy.getTestId(`${key}-label`).should('not.exist')
            cy.getTestId(`${key}-plain-text`).should('not.exist')
          }
        }
      })
    })

    describe('ID & Redacted Types', () => {
      it('renders an ID correctly', () => {
        const val = 'abc-123-cats-are-neat'
        const item: RecordItem = {
          type: ConfigurationSchemaType.ID,
          key: 'id',
          label: 'ID',
          value: val,
        }

        cy.mount(ConfigCardItem, {
          props: {
            item,
          },
        })

        cy.get('.config-card-details-row').should('be.visible')
        cy.getTestId(`${item.key}-copy-uuid`).should('be.visible')
        cy.getTestId(`${item.key}-copy-uuid`).should('contain.text', val)
      })

      it('renders an ID Array correctly', () => {
        const ids = ['abc-123-cats-are-neat', 'def-456-dogs-are-neat']
        const item: RecordItem = {
          type: ConfigurationSchemaType.IdArray,
          key: 'client_ids',
          label: 'Client ID',
          value: ids,
        }

        cy.mount(ConfigCardItem, {
          props: {
            item,
          },
        })

        cy.get('.config-card-details-row').should('be.visible')
        cy.getTestId(`${item.key}-copy-uuid-array`).should('be.visible')
        ids.forEach((id: string, idx: number) => {
          cy.getTestId(`${item.key}-copy-uuid-${idx}`).should('be.visible')
          cy.getTestId(`${item.key}-copy-uuid-${idx}`).should('contain.text', id)
        })
      })

      it('correctly handles copy ID click', () => {
        const val = 'abc-123-cats-are-neat'
        const item: RecordItem = {
          type: ConfigurationSchemaType.ID,
          key: 'id',
          label: 'ID',
          value: val,
        }
        cy.window().then((win) => {
          cy.stub(win.navigator.clipboard, 'writeText').resolves()
        })

        cy.mount(ConfigCardItem, {
          props: {
            item,
          },
        })

        cy.get('.config-card-details-row').should('be.visible')
        cy.getTestId(`${item.key}-copy-uuid`).should('be.visible')
        cy.get('.text-icon-wrapper [data-testid="copy-to-clipboard"]').should('exist')
        cy.get('.text-icon-wrapper .k-tooltip').should('exist')
        cy.get('.text-icon-wrapper [data-testid="copy-to-clipboard"]').click()
        cy.window().then(() => {
          cy.get('.text-icon-wrapper .k-tooltip').should('contain.text', 'Copied!')
        })
      })

      it('renders a redacted ID correctly', () => {
        const val = 'abc-123-cats-are-neat'
        const item: RecordItem = {
          type: ConfigurationSchemaType.Redacted,
          key: 'id',
          label: 'ID',
          value: val,
        }

        cy.mount(ConfigCardItem, {
          props: {
            item,
          },
        })

        cy.get('.config-card-details-row').should('be.visible')
        cy.getTestId(`${item.key}-copy-uuid-redacted`).should('be.visible')
        cy.getTestId(`${item.key}-copy-uuid-redacted`).should('contain.text', '*')
        cy.getTestId(`${item.key}-copy-uuid-redacted`).should('not.contain.text', val)
      })

      it('renders a redacted ID Array correctly', () => {
        const ids = ['abc-123-cats-are-neat', 'def-456-dogs-are-neat']
        const item: RecordItem = {
          type: ConfigurationSchemaType.RedactedArray,
          key: 'client_ids',
          label: 'Client ID',
          value: ids,
        }

        cy.mount(ConfigCardItem, {
          props: {
            item,
          },
        })

        cy.get('.config-card-details-row').should('be.visible')
        cy.getTestId(`${item.key}-copy-uuid-array`).should('be.visible')
        ids.forEach((id: string, idx: number) => {
          cy.getTestId(`${item.key}-copy-uuid-${idx}`).should('be.visible')
          cy.getTestId(`${item.key}-copy-uuid-${idx}`).should('contain.text', '*')
          cy.getTestId(`${item.key}-copy-uuid-${idx}`).should('not.contain.text', id)
        })
      })
    })

    describe('Badges', () => {
      it('renders Status badge correctly', () => {
        const statuses = [true, false]

        statuses.forEach((status: boolean) => {
          const item: RecordItem = {
            type: ConfigurationSchemaType.BadgeStatus,
            key: 'status',
            label: 'Status',
            value: status,
          }

          cy.mount(ConfigCardItem, {
            props: {
              item,
            },
          })

          cy.get('.config-card-details-row').should('be.visible')
          cy.getTestId(`${item.key}-badge-status`).should('be.visible')

          if (status) {
            cy.get('.k-badge.success').should('exist')
          } else {
            cy.get('.k-badge.neutral').should('exist')
          }
        })
      })

      it('renders Tags correctly', () => {
        const tags = ['cats', 'purr', 'meow']
        const item: RecordItem = {
          type: ConfigurationSchemaType.BadgeTag,
          key: 'tags',
          label: 'Tags',
          value: tags,
        }

        cy.mount(ConfigCardItem, {
          props: {
            item,
          },
        })

        cy.get('.config-card-details-row').should('be.visible')
        cy.getTestId(`${item.key}-badge-tags`).should('be.visible')

        tags.forEach((tag: string, idx: number) => {
          cy.getTestId(`${item.key}-badge-tag-${idx}`).should('contain.text', tag)
        })
      })

      it('renders CopyBadge correctly', () => {
        const tags = ['cats', 'purr', 'meow']
        const item: RecordItem = {
          type: ConfigurationSchemaType.CopyBadge,
          key: 'tags',
          label: 'Tags',
          value: tags,
        }

        cy.mount(ConfigCardItem, {
          props: {
            item,
          },
        })

        cy.get('.config-card-details-row').should('be.visible')
        cy.getTestId(`${item.key}-copy-uuid-array`).should('be.visible')

        tags.forEach((id: string, idx: number) => {
          cy.getTestId(`${item.key}-copy-uuid-${idx}`).should('be.visible')
          cy.getTestId(`${item.key}-copy-uuid-${idx}`).should('contain.text', id)
        })
      })

      it('renders MethodBadges correctly', () => {
        const methods = ['GET', 'PUT', 'POST', 'FOO']
        const item: RecordItem = {
          type: ConfigurationSchemaType.BadgeMethod,
          key: 'methods',
          label: 'Methods',
          value: methods,
        }

        cy.mount(ConfigCardItem, {
          props: {
            item,
          },
        })

        cy.get('.config-card-details-row').should('be.visible')
        cy.getTestId(`${item.key}-badge-methods`).should('be.visible')

        methods.forEach((method: string, idx: number) => {
          cy.getTestId(`${item.key}-badge-method-${idx}`).should('contain.text', method)
        })
      })
    })

    describe('Links', () => {
      it('renders an internal link correctly', () => {
        const link = 'http://www.tk-is-a-cool-cat.com'
        const item: RecordItem = {
          type: ConfigurationSchemaType.LinkInternal,
          key: 'cool_link',
          label: 'Cool Link',
          value: link,
        }

        cy.mount(ConfigCardItem, {
          props: {
            item,
          },
        })

        cy.get('.config-card-details-row').should('be.visible')
        cy.getTestId(`${item.key}-internal-link`).should('be.visible')
        cy.getTestId(`${item.key}-internal-link`).should('contain.text', link)
      })

      it('emits @navigation-click event when Internal Link clicked', () => {
        const link = 'http://www.tk-is-a-cool-cat.com'
        const item: RecordItem = {
          type: ConfigurationSchemaType.LinkInternal,
          key: 'cool_link',
          label: 'Cool Link',
          value: link,
        }

        cy.mount(ConfigCardItem, {
          props: {
            item,
          },
        })

        cy.get('.config-card-details-row').should('be.visible')
        cy.getTestId(`${item.key}-internal-link`).should('be.visible')
        // eslint-disable-next-line cypress/unsafe-to-chain-command
        cy.getTestId(`${item.key}-internal-link`).click().then(() => {
          // emits navigation-click event
          cy.wrap(Cypress.vueWrapper.emitted('navigation-click')).should('have.length', 1)
        })
      })

      it('renders an external link correctly', () => {
        const link = 'http://www.tk-is-a-cool-cat.com'
        const item: RecordItem = {
          type: ConfigurationSchemaType.LinkExternal,
          key: 'cool_link',
          label: 'Cool Link',
          value: link,
        }

        cy.mount(ConfigCardItem, {
          props: {
            item,
          },
        })

        cy.get('.config-card-details-row').should('be.visible')
        cy.get('.k-external-link .kui-icon.external-link-icon').should('be.visible')
        cy.getTestId(`${item.key}-external-link`).should('be.visible')
        cy.getTestId(`${item.key}-external-link`).should('contain.text', link)
        cy.get(`a[href="${link}"]`).should('exist')
      })

      it('plaintext config card item has data-testid', () => {
        const item: RecordItem = {
          type: ConfigurationSchemaType.Text,
          key: 'textItem',
          label: 'textItem',
          value: 'asdf',
        }

        cy.mount(ConfigCardItem, {
          props: {
            item,
          },
        })

        cy.get('[data-testid="textItem-plain-text"]').should('exist')
        cy.get('[data-testid="textItem-plain-text"]').should('contain.text', 'asdf')
      })
    })
  })
})
