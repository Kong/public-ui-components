export const DECIMAL_DISPLAY = 2
export const FONT_SIZE_SMALL = 10
export const FONT_SIZE_REGULAR = 12

const numberFormatter = new Intl.NumberFormat(document?.documentElement?.lang || 'en-US')
export { numberFormatter }

export const MAX_LABEL_LENGTH = 10
