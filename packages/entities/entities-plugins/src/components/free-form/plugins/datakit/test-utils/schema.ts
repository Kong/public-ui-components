import datakitSchema from './datakit-schema.json'

import type { FormSchema } from '@kong-ui-public/freeform'

/**
 * The Datakit plugin schema served by the gateway.
 * Copied from Kong/gateway-schema-watcher `api-gateway/plugins/datakit.json`; update it when the gateway schema changes.
 */
export const DATAKIT_PLUGIN_SCHEMA = datakitSchema as unknown as FormSchema
