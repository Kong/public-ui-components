import SwaggerUI from 'swagger-ui'
import { SwaggerUIKongTheme } from '@kong/swagger-ui-kong-theme-universal'
import kongThemeStyles from '@kong/swagger-ui-kong-theme-universal/dist/main.css'
import { attributeValueToBoolean, operationToSwaggerThingArray, operationToSwaggerThingId } from './utils'
import overridesStyles from './styles/overrides.css'
import essentialsOnlyStyles from './styles/essentialsOnly.css'

const relativeSidebarStyles = `
/* relative sidebar styles */
div#sidebar {
  position: relative;
  top: unset;
  left: unset;
}
`

export class SwaggerUIElement extends HTMLElement {
  static name = 'kong-swagger-ui'

  /**
   * Should SwaggerUI be automatically initialized after connecting?
   * @type {boolean}
   */
  #autoInit = true

  /**
   * Specification object or string. Required if `url` property is not set
   * @type {object|string}
   */
  #spec = undefined

  /**
   * URL of the specification file. Required if `spec` property is not set
   * @type {null}
   */
  #url = null

  /**
   * Should SwaggerUI navigation sidebar be enabled?
   * @type {boolean}
   */
  #hasSidebar = true

  /**
   * Position the sidebar relatively instead of fixed
   */
  #relativeSidebar = false

  /**
   * Should SwaggerUI show information section, schemes, actions (Authorize/Try it out), etc
   * @type {boolean}
   */
  #essentialsOnly = false

  /**
   * SwaggerUI instance
   * @type {object}
   */
  #instance = null

  /**
   * Properties to override in the theme passed to SwaggerUI
   * @type {object}
   */
  #themeOverrides = {}

  /**
   * True if application registration available for service version
   * @type {boolean}
   */
  #applicationRegistrationEnabled = false

  /**
   * name for selected version
   * @type {string}
   */
  #currentVersion

  constructor() {
    super()

    this.rootElement = document.createElement('div')

    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(this.rootElement)
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'spec':
        try {
          this.spec = newValue
        } catch (e) {
          console.error('The "spec" attribute value has to be a valid JSON:', e)
        }
        break
      case 'url':
        this.url = newValue
        break
      case 'auto-init':
        this.autoInit = newValue
        break
      case 'has-sidebar':
        this.hasSidebar = newValue
        break
      case 'relative-sidebar':
        this.relativeSidebar = newValue
        break
      case 'essentials-only':
        this.essentialsOnly = newValue
        break
      case 'application-registration-enabled':
        this.applicationRegistrationEnabled = newValue
        break
      case 'current-version':
        this.currentVersion = newValue
        break
      case 'theme-overrides':
        this.themeOverrides = JSON.parse(decodeURIComponent(newValue))

        if (typeof this.themeOverrides !== 'object') {
          this.themeOverrides = {}
          console.error('The "themeOverrides" attribute value has to be a valid object')
        }

        break
    }
  }

  connectedCallback() {
    if (this.#autoInit) {
      this.init()
    }
  }

  disconnectedCallback() {
    kongThemeStyles.unuse()
    overridesStyles.unuse()

    if (this.#essentialsOnly) {
      essentialsOnlyStyles.unuse()
    }
  }

  init() {
    if (this.#instance) {
      throw new Error('SwaggerUI is already initialized')
    }

    if (!this.isConnected) {
      throw new Error('kong-swagger-ui is no longer connected')
    }

    if (!this.#url && !this.#spec) {
      throw new Error('either `spec` or `url` has to be set to initialize SwaggerUI')
    }

    if ((this.relativeSidebar && !this.#hasSidebar) || (this.#relativeSidebar && !this.#essentialsOnly)) {
      console.warn('For correct positioning, you must enable the sidebar with `has-sidebar="true"` and should only display essentials with `essentials-only="true"`')
    }

    // load base styles
    kongThemeStyles.use({ target: this.shadowRoot, testId: 'default-styles' })

    // load style overrides
    overridesStyles.use({ target: this.shadowRoot, testId: 'overrides-styles' })

    // TODO: Remove sidebar support
    // relatively position the sidebar if essentials only
    if (this.#hasSidebar && this.#essentialsOnly && this.#relativeSidebar) {
      const styleTag = document.createElement('style')
      styleTag.innerHTML = relativeSidebarStyles
      styleTag.setAttribute('data-testid', 'relative-sidebar-styles')
      this.shadowRoot.appendChild(styleTag)
    }

    // hide non-essential sections
    if (this.#essentialsOnly) {
      essentialsOnlyStyles.use({ target: this.shadowRoot, testId: 'hide-essentials-styles' })
    }

    const onViewSpecClick = () => {
      this.dispatchEvent(new CustomEvent('clicked-view-spec', { bubbles: true }))
    }

    const onRegisterClick = () => {
      this.dispatchEvent(new CustomEvent('clicked-register', { bubbles: true }))
    }

    const defaultTheme = {
      hasSidebar: this.#hasSidebar,
      applicationRegistrationEnabled: this.#applicationRegistrationEnabled,
      currentVersion: { version: this.#currentVersion },
      onViewSpecClick,
      onRegisterClick,
    }

    const mergedThemeObject = { ...defaultTheme, ...this.#themeOverrides }

    this.#instance = SwaggerUI({
      url: this.#url,
      spec: this.#spec,
      domNode: this.rootElement,
      deepLinking: true,
      filter: true,
      presets: [
        SwaggerUI.presets.apis,
        SwaggerUI.SwaggerUIStandalonePreset,
      ],
      plugins: [SwaggerUI.plugins.DownloadUrl, SwaggerUIKongTheme],
      layout: 'KongLayout',
      theme: mergedThemeObject,
    })
  }

  showOperation(operation) {
    if (!this.#instance) {
      return false
    }

    const thingArray = operationToSwaggerThingArray(operation)
    this.#instance.layoutActions.show(thingArray, true)
    return true
  }

  hideOperation(operation) {
    if (!this.#instance) {
      return false
    }

    const thingArray = operationToSwaggerThingArray(operation)
    this.#instance.layoutActions.show(thingArray, false)
    return true
  }

  scrollToOperation(operation) {
    if (!this.#instance) {
      return false
    }

    const operationElementId = operationToSwaggerThingId(operation)
    let scrollElement = this.shadowRoot.getElementById(operationElementId)
    if (!scrollElement) {
      // we are going to see if the parent div element exists and then try and find the
      // element again
      const parentDiv = this.shadowRoot.querySelector(`[data-tag='${operation.tag}']`)

      if (parentDiv) {
        parentDiv.click()
        scrollElement = this.shadowRoot.getElementById(operationElementId)

        if (!scrollElement) {
          return false
        }
      } else {
        return false
      }
    }

    // respect reduced motion settings
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: no-preference)')
    let behavior
    if (mediaQuery && mediaQuery.matches) {
      behavior = 'smooth'
    }

    scrollElement.scrollIntoView({ behavior })
  }

  get autoInit() {
    return this.#autoInit
  }

  set autoInit(autoInit) {
    this.#autoInit = attributeValueToBoolean(autoInit)
  }

  get hasSidebar() {
    return this.#hasSidebar
  }

  set hasSidebar(hasSidebar) {
    this.#hasSidebar = attributeValueToBoolean(hasSidebar)
  }

  get relativeSidebar() {
    return this.#relativeSidebar
  }

  set relativeSidebar(relativeSidebar) {
    this.#relativeSidebar = attributeValueToBoolean(relativeSidebar)
  }

  get essentialsOnly() {
    return this.#essentialsOnly
  }

  set essentialsOnly(essentialsOnly) {
    this.#essentialsOnly = attributeValueToBoolean(essentialsOnly)
  }

  get spec() {
    return this.#spec
  }

  set spec(spec) {
    if (!spec) {
      throw new Error('Spec cannot be empty')
    }

    let parsedSpec
    if (typeof spec === 'string') {
      parsedSpec = JSON.parse(spec)
    } else if (typeof spec === 'object') {
      parsedSpec = spec
    }

    this.#spec = parsedSpec

    if (this.#instance) {
      // update SwaggerUI store
      this.#instance.getSystem().specActions.updateJsonSpec(this.#spec)
    }
  }

  get url() {
    return this.#url
  }

  set url(url) {
    this.#url = url
  }

  get themeOverrides() {
    return this.#themeOverrides
  }

  set themeOverrides(themeOverrides) {
    this.#themeOverrides = themeOverrides
  }

  get applicationRegistrationEnabled() {
    return this.#applicationRegistrationEnabled
  }

  set applicationRegistrationEnabled(applicationRegistrationEnabled) {
    this.#applicationRegistrationEnabled = attributeValueToBoolean(applicationRegistrationEnabled)
  }

  get currentVersion() {
    return this.#currentVersion
  }

  set currentVersion(currentVersion) {
    this.#currentVersion = currentVersion
  }

  static get observedAttributes() {
    return [
      'url',
      'spec',
      'auto-init',
      'has-sidebar',
      'relative-sidebar',
      'essentials-only',
      'application-registration-enabled',
      'current-version',
      'theme-overrides',
    ]
  }
}
