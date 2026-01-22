export interface ActionOptions {
  type?: Partial<Cypress.TypeOptions>
  click?: Partial<Cypress.ClickOptions>
  check?: Partial<Cypress.CheckOptions>
  clear?: Partial<Cypress.ClearOptions> | false
}

export const defaultActionOptions: ActionOptions = {
  type: { force: true },
  click: { force: true },
  check: { force: true },
  clear: { force: true },
}
