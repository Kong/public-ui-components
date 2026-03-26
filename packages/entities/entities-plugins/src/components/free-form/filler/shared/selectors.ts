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

  // MapField
  map: (path: string) => `[data-testid="ff-map-${path}"]`,
  mapContainer: (path: string, index: number) => `[data-testid="ff-map-container-${path}.${index}"]`,
  mapKey: (path: string, index: number) => `[data-testid="ff-map-key-${path}.${index}"]`,
  mapRemoveBtns: (path: string) => `[data-testid^="ff-map-remove-btn-${path}"]`,
  mapRemoveBtn: (path: string, index: number) => `[data-testid="ff-map-remove-btn-${path}.${index}"]`,
  mapAddBtn: (path: string) => `[data-testid="ff-map-add-btn-${path}"]`,

  // StringArrayField
  tag: (path: string) => `[data-testid="ff-tag-${path}"]`,
  tagInput: (path: string) => `[data-testid="ff-tag-${path}"] input`,

  // JsonField
  json: (path: string) => `[data-testid="ff-json-${path}"]`,
}
