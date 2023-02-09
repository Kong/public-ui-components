export function toSlug(input: string, suffix = '') {
  return input
    .toLowerCase()
    .trim()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '') + suffix
}
