export interface SensitiveInputLabels {
  /** Label for the "Rotate key" action shown in the masked (edit) state. */
  rotateLabel?: string
  /** Label for the "Generate key" action shown when `generateKey` is provided. */
  generateLabel?: string
  /** Text for the one-time hint banner shown when `showOneTimeHint` is `true`. */
  hintLabel?: string
}
