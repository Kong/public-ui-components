import type { CountryIsoMap, CountryISOA2 } from '../types'

import { COUNTRIES } from '../types'

export const countries: Map<string, CountryIsoMap> = new Map(COUNTRIES.map(country => [country.code, { code: country.code, name: country.name }]))

export const getCountryName = (country_code: CountryISOA2) => {
  return countries.get(country_code)?.name || country_code
}
