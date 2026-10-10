/**
 * This hashes a string and turns it into a positive integer very quickly. It is
 * relatively decent at generating values that are distributed evenly. However,
 * it is NOT cryptographically secure in any way. Used to turn a string into a
 * consistent number.
 *
 * implementation from: https://gist.github.com/eplawless/52813b1d8ad9af510d85?permalink_comment_id=3367765
 * use case article: https://mojoauth.com/hashing/bernsteins-hash-djb2-in-javascript-in-browser#use-cases-for-bernsteins-hash-djb2
 */
export const djb2 = (str: string): number => {
  const len = str.length
  let h = 5381

  for (let i = 0; i < len; i++) {
    h = h * 33 ^ str.charCodeAt(i)
  }
  return h >>> 0
}

