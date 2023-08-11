export const isRoutePayloadValid = (val: any): boolean => {
  return 'service' in val && 'tags' in val && 'regex_priority' in val && 'path_handling' in val && 'protocols' in val
}
