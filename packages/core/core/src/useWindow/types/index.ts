export interface WindowComposable {
  getLocationHostname: () => string,
  getLocationHref: () => string,
  getLocationOrigin: () => string,
  getLocationPathname: () => string,
  getLocationSearch: () => string,
  getUrlSearchParams: () => URLSearchParams,
  setLocationAssign: (url: string) => void,
  setLocationReplace: (url: string) => void,
}
