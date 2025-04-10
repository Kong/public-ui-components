/**
 * Converts a Lua pattern string to a JavaScript regular expression pattern string.
 *
 * @param luaPattern Lua pattern string
 * @returns JavaScript regular expression pattern string
 * @see https://www.lua.org/pil/20.2.html
 */
export const toRegExpPattern = (luaPattern: string) =>
  luaPattern
    .replace(/%a/g, '[A-Za-z]') // %a -> letters
    .replace(/%d/g, '\\d') // %d -> digits
    .replace(/%l/g, '[a-z]') // %l -> lower case letters
    .replace(/%p/g, "[!\"#$%&'()*+,\\-./:;<=>?@[\\]^_`{|}~]") // %p -> punctuation characters
    .replace(/%s/g, '\\s') // %s -> space characters
    .replace(/%u/g, '[A-Z]') // %u -> upper case letters
    .replace(/%w/g, '\\w') // %w -> alphanumeric characters
    .replace(/%x/g, '[0-9A-Fa-f]') // %x -> hexadecimal digits
    // magic characters: ( ) . % + - * ? [ ^ $
    .replace(/%\(/g, '\\(') // %( -> literal (
    .replace(/%\)/g, '\\)') // %) -> literal )
    .replace(/%\./g, '\\.') // %. -> literal .
    .replace(/%\+/g, '\\+') // %+ -> literal +
    .replace(/%-/g, '\\-') // %- -> literal -
    .replace(/%\*/g, '\\*') // %* -> literal *
    .replace(/%\?/g, '\\?') // %? -> literal ?
    .replace(/%\[/g, '\\[') // %[ -> literal [
    .replace(/%\^/g, '\\^') // %^ -> literal ^
    .replace(/%\$/g, '\\$') // %$ -> literal $
    .replace(/%%/g, '%') // %% -> literal %
