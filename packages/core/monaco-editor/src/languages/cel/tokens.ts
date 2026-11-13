// CEL string literals (with raw/bytes prefixes) and `//` comments. CEL has no block comments.
// An unterminated literal or comment runs to the end of the source.
export const CEL_LITERALS_AND_COMMENTS = /\/\/[^\n]*|(?:[rRbB]{1,2})?(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\[\s\S]|[^"\\])*(?:"|$)|'(?:\\[\s\S]|[^'\\])*(?:'|$))/g

/** Blank literals and comments, keeping offsets. */
export const maskCelLiterals = (source: string) =>
  source.replace(CEL_LITERALS_AND_COMMENTS, token => ' '.repeat(token.length))

/** Whether the end of `before` is inside a literal or comment. */
export const endsInCelLiteral = (before: string) => {
  // A token that reaches past a sentinel character is still open at the cursor.
  const probe = before + '\0'
  return [...probe.matchAll(CEL_LITERALS_AND_COMMENTS)].some(token => token.index + token[0].length === probe.length)
}
