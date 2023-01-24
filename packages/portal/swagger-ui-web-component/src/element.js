import SwaggerUI from 'swagger-ui'
import { SwaggerUIKongTheme } from '@kong/swagger-ui-kong-theme'
import { attributeValueToBoolean } from './utils'

const kongThemeStyles = require('!!raw-loader!@kong/swagger-ui-kong-theme/dist/main.css')
const essentialsOnlyStyles = `
/* hide non-essential sections & features */
.info-augment-wrapper,
.swagger-ui section,
.swagger-ui .opblock-tag .info__externaldocs,
.swagger-ui .auth-wrapper,
.swagger-ui .try-out,
.opblock-body .right-side-wrapper .code-snippet {
  display: none !important;
}
/* fix copy button width */
.swagger-ui .opblock .opblock-summary:hover .view-line-link.copy-to-clipboard {
  width: 24px;
}
.swagger-ui .copy-to-clipboard {
  margin-left: 8px !important;
  right: unset !important;
}
`

const relativeSidebarStyles = `
/* relative sidebar styles */
div#sidebar {
  position: relative;
  top: unset;
  left: unset;
}
`

export class SwaggerUIElement extends HTMLElement {
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
    }
  }

  connectedCallback() {
    if (this.#autoInit) {
      this.init()
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

    if (this.relativeSidebar && !this.#hasSidebar || this.#relativeSidebar && !this.#essentialsOnly) {
      console.warn('For correct positioning, you must enable the sidebar with `has-sidebar="true"` and should only display essentials with `essentials-only="true"`')
    }

    // load base styles
    const styleTag = document.createElement('style')
    styleTag.innerHTML = kongThemeStyles.default
    styleTag.setAttribute('data-testid', 'default-styles')
    this.shadowRoot.appendChild(styleTag)

    // relatively position the sidebar if essentials only
    if (this.#hasSidebar && this.#essentialsOnly && this.#relativeSidebar) {
      const styleTag = document.createElement('style')
      styleTag.innerHTML = relativeSidebarStyles
      styleTag.setAttribute('data-testid', 'relative-sidebar-styles')
      this.shadowRoot.appendChild(styleTag)
    }

    // hide non-essential sections
    if (this.#essentialsOnly) {
      const styleTag = document.createElement('style')
      styleTag.innerHTML = essentialsOnlyStyles
      styleTag.setAttribute('data-testid', 'hide-essentials-styles')
      this.shadowRoot.appendChild(styleTag)
    }

    this.#instance = SwaggerUI({
      url: this.#url,
      spec: this.#spec,
      domNode: this.rootElement,
      deepLinking: true,
      filter: true,
      presets: [
        SwaggerUI.presets.apis,
        SwaggerUI.SwaggerUIStandalonePreset
      ],
      plugins: [
        SwaggerUI.plugins.DownloadUrl,
        SwaggerUIKongTheme
      ],
      layout: 'KongLayout',
      theme: {
        hasSidebar: this.#hasSidebar
      }
    })
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
      throw new Error("Spec cannot be empty")
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

  static get observedAttributes() {
    return ['url', 'spec', 'auto-init', 'has-sidebar', 'relative-sidebar', 'essentials-only']
  }
}
