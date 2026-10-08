export const nestedPageLayoutInjectionKey = Symbol('nested-page-layout-detection')

/**
 * Injection key for the boolean (or ref/getter) that tells PageLayout to render the new
 * page header appearance.
 */
export const NEW_APPEARANCE_INJECTION_KEY = 'page-layout:new-appearance'

/**
 * Injection key for the boolean (or ref/getter) that tells PageLayout whether the host
 * application wants the "Ask KAi" button rendered. Only honored in the new appearance.
 */
export const SHOW_KAI_BUTTON_INJECTION_KEY = 'page-layout:show-kai-button'

/** Injection key for the callback PageLayout calls when the "Ask KAi" button is clicked. */
export const KAI_BUTTON_CLICK_INJECTION_KEY = 'page-layout:kai-button-click'
