export const selectors = {
  // Common
  field: (path: string) => `[data-testid="ff-${path}"]`,
  label: (path: string) => `[data-testid="ff-label-${path}"]`,

  // EnumField
  selectTrigger: (path: string) => `[data-testid="ff-enum-${path}-items"]`,
  multiSelectItem: (value: string) => `[data-testid="multiselect-item-${value}"]`,
  selectItem: (value: string) => `[data-testid="select-item-${value}"]`,

  // ArrayField
  array: (path: string) => `[data-testid="ff-array-${path}"]`,
  arrayTabContainer: (path: string) => `[data-appearance="tabs"][data-testid="ff-array-${path}"]`,
  arrayBasicContainer: (path: string) => `[data-testid="ff-array-${path}"]:not([data-appearance="tabs"])`,
  arrayTabs: (path: string) => `[data-testid="ff-array-tabs-${path}"]`,
  arrayItem: (path: string, index: number) => `[data-testid="ff-array-item-${path}.${index}"]`,
  arrayAddBtn: (path: string) => `[data-testid="ff-add-item-btn-${path}"]`,
  arrayRemoveBtns: (path: string) => `[data-testid^="ff-array-remove-item-btn-${path}"]`,
  arrayRemoveBtn: (path: string, index: number) => `[data-testid="ff-array-remove-item-btn-${path}.${index}"]`,

  // ObjectField
  object: (path: string) => `[data-testid="ff-object-${path}"]`,
  objectToggleBtn: (path: string) => `[data-testid="ff-object-toggle-btn-${path}"]`,
  objectSwitch: (path: string) => `[data-testid="ff-object-switch-${path}"]`,
  objectContent: (path: string) => `[data-testid="ff-object-content-${path}"]`,

  // KeyValueField
  kv: (path: string) => `[data-testid="ff-kv-${path}"]`,
  kvEntry: (path: string, index: number) => `[data-testid="ff-kv-container-${path}.${index}"]`,
  kvKey: (path: string, index: number) => `[data-testid="ff-key-${path}.${index}"]`,
  kvValue: (path: string, index: number) => `[data-testid="ff-value-${path}.${index}"]`,
  kvRemoveBtns: (path: string) => `[data-testid^="ff-kv-remove-btn-${path}"]`,
  kvRemoveBtn: (path: string, index: number) => `[data-testid="ff-kv-remove-btn-${path}.${index}"]`,
  kvAddBtn: (path: string) => `[data-testid="ff-kv-add-btn-${path}"]`,

  // StringArrayField
  tag: (path: string) => `[data-testid="ff-tag-${path}"]`,

  // JsonField
  json: (path: string) => `[data-testid="ff-json-${path}"]`,
}
