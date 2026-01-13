/**
 * Clamps a value between a minimum and maximum range
 * @param value - The value to clamp
 * @param min - The minimum allowed value
 * @param max - The maximum allowed value
 * @returns number - The clamped value
 */
export const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max)
