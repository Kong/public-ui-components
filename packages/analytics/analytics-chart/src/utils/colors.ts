export const datavisPalette = [
  '#a86cd5',
  '#6a86d2',
  '#00bbf9',
  '#00c4b0',
  '#ffdf15',
]

// Wrap around if we run out of colors.
export const lookupDatavisColor = (idx: number, customPalette?: string[]) => {
  const colorLookup = customPalette || datavisPalette
  return colorLookup[idx % datavisPalette.length]
}

export const darkenColor = (hex: string, amt: number): string => {
  if (hex[0] === '#') {
    hex = hex.slice(1)
  }

  let R = parseInt(hex.substring(0, 2), 16)
  let G = parseInt(hex.substring(2, 4), 16)
  let B = parseInt(hex.substring(4, 6), 16)

  R = R - amt
  G = G - amt
  B = B - amt

  if (R > 255) {
    R = 255
  } else if (R < 0) {
    R = 0
  }

  if (G > 255) {
    G = 255
  } else if (G < 0) {
    G = 0
  }

  if (B > 255) {
    B = 255
  } else if (B < 0) {
    B = 0
  }

  const RR = ((R.toString(16).length === 1) ? '0' + R.toString(16) : R.toString(16))
  const GG = ((G.toString(16).length === 1) ? '0' + G.toString(16) : G.toString(16))
  const BB = ((B.toString(16).length === 1) ? '0' + B.toString(16) : B.toString(16))

  return `#${RR}${GG}${BB}`
}

export const accessibleGrey = '#6f7787' // grey-500
