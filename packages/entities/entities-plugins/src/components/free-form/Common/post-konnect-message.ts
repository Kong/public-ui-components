/**
 * Interface for data sent as a Konnect message.
 *
 * @template TCustomPayload - Represents the type of the custom payload when `action` is set to 'custom'. Defaults to `Record<string, any>` if not specified, allowing any key-value pair.
 */
export interface PostKonnectMessageData<TCustomPayload = Record<string, any>> {
  /** The app scope of the message. One of `KONNECT_PRIMARY_ROUTE_KEYS` e.g. `learning-hub`, use 'current' when message intended to currenly active host app */
  app: string
  /** The action to target when received. */
  action:
  /** iframe is ready */
  'ready' |
  /** Show the iframe. May be used with the `path` property */
  'show' |
  /** Hide the iframe */
  'hide' |
  /** The URL path in the iframe has changed. Check the `path` property for the new route.fullPath */
  'iframe-path-changed' |
  /** Navigate the host app from the iframe. Must be used with the `path` property */
  'navigate-app' |
  /** forces click on element described in payload */
  'click' |
  /** send custom event between host app and iframe. Must adhere to the format `custom:<action>`. */
  `custom:${string}`
  /** The route.fullPath of a navigation event; used when requesting the iframe navigate, or if navigation occurred. Typically a relative path from the root, e.g. `/global/learning-hub/welcome` */
  path?: string
  /** payload for the click action */
  clickPayload?: {
    /** data-testid attribute of the element to be clicked */
    dataTestId: string
    /** create element if not found */
    create: boolean
    /** toogle intercom visibility to true before click */
    showIntercom: boolean
  }
  /** send a payload that is utilized alongside `action: 'custom'` */
  customPayload?: TCustomPayload
}


/** The id of the Learning Hub iframe for posting events */
export const LEARNING_HUB_IFRAME_ID = 'learning-hub-iframe'

/** The id of the Learning Hub iframe for posting events */
export const DR_WHO_AGENT_IFRAME_ID = 'dr-who-agent-iframe'


/**
 * Posts a message to the learning hub.
 * @param {PostKonnectMessageData} data - The data to be sent in the message.
 * @template TCustomPayload - Represents the type of the custom payload when action is set to 'custom'. Defaults to Record<string, any> if not specified, allowing any key-value pair.
 */
export const postKonnectMessage = <TCustomPayload = Record<string, any>>(data: PostKonnectMessageData<TCustomPayload>): void => {
  if (!data.app) {
    console.error('postKonnectMessage: data.app is required')
    return
  }
  if (!data.action) {
    console.error('postKonnectMessage: data.action is required')
    return
  }
  if (data.path?.startsWith('http')) {
    console.error('postKonnectMessage: data.path must be a relative path, e.g. `/global/organization/users`')
    return
  }

  if (data.action === 'click' && !data.clickPayload) {
    console.error('postKonnectMessage: data.clickPayload required for \'click\' action')
  }

  // !Important: Always post the message _both_ to the parent window AND the iframe

  // Post message to the parent window
  window.parent.postMessage(data, window.location.origin)

  // Initialize each iframe element id selector
  const learningHubIframe = document.getElementById(LEARNING_HUB_IFRAME_ID) as HTMLIFrameElement | null
  const drWhoAgentIframe = document.getElementById(DR_WHO_AGENT_IFRAME_ID) as HTMLIFrameElement | null

  // Determine window object based on iframe id, as we must post the message to the iframe if talking from the host app
  if (data.app === 'learning-hub' && learningHubIframe) {
    // Post the message to the desired iframe
    learningHubIframe.contentWindow?.postMessage(data, window.location.origin)
  }
  if (data.app === 'dr-who-agent' && drWhoAgentIframe) {
    // Post the message to the desired iframe
    drWhoAgentIframe.contentWindow?.postMessage(data, window.location.origin)
  }

}
