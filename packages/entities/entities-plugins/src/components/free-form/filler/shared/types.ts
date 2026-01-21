export interface ActionOptions {
  type?: Partial<Cypress.TypeOptions>
  click?: Partial<Cypress.ClickOptions>
  check?: Partial<Cypress.CheckOptions>
  clear?: Partial<Cypress.ClearOptions> | false
}

export const defaultActionOptions: ActionOptions = {
  type: {},
  click: {},
  check: { force: true },
  clear: {},
}
