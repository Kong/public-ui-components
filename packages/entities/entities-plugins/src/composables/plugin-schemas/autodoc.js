import * as autodoc from './autodoc.json'

/**
 * @typedef {Object} AutodocField
 * @property {string=} desc
 */

/**
 * Get the autodoc definition for a specific field of a specific entity
 *
 * @template {keyof autodoc} K
 * @param {K} entity
 * @param {keyof autodoc[K]} field
 * @returns {AutodocField}
 */
export const getAutodocField = (entity, field) => {
  if (autodoc.default[entity]) {
    return autodoc.default[entity][field]
  }
}
