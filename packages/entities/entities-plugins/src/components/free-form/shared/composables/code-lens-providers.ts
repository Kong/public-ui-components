// DO NOT EXPORT THIS FILE IN THE `components/free-form/shared/composables/index.ts` BARREL
//
// tsconfig.filler.json
// -> (include) components/free-form/filler/shared/field-walker.ts
// -> (imports) components/free-form/shared/composables/index.ts
//              `export * from './code-lens-providers'`
// -> (imports) components/free-form/shared/composables/code-lens-providers.ts
//              `import packages/entities/entities-plugins/src/types/index.ts`
// -> ...
// -> (imports) `*.vue` * <- tsc fails here

import { useAxios } from '@kong-ui-public/entities-shared'
import { collectCodeLensProviders, emptyCodeLensList } from '@kong-ui-public/monaco-editor'
import {
  createYAMLCopyUUIDCodeLensProvider,
  createYAMLValueCodeLensProvider,
} from '@kong-ui-public/monaco-editor/languages/yaml'
import { editor, Emitter, languages } from 'monaco-editor'
import { nanoid } from 'nanoid'
import { useRouter } from 'vue-router'

import useI18n from '../../../../composables/useI18n'
import endpoints from '../../../../plugins-endpoints'
import { buildSchemaMap } from './schema'

import type { X509Certificate } from '@peculiar/x509'
import type { AxiosRequestConfig } from 'axios'
import type { IDisposable, IRange } from 'monaco-editor'
import type { RouteLocationRaw } from 'vue-router'

import type { KongManagerPluginFormConfig, KonnectPluginFormConfig } from '../../../../types'
import type { ForeignFieldSchema, FormSchema, UnionFieldSchema } from '../../../../types/plugins/form-schema'

type PluginFormConfig = KonnectPluginFormConfig | KongManagerPluginFormConfig

const modelProviderDisposables = new WeakMap<editor.ITextModel, () => void>()

export type EntityLensConfig = {
  entity: EntityKind
  keyPath?: string[]
}

// Note: "vault" may also be supported in the future, but given fact that the vault-auth
// plugin is not available on Konnect, leaving it out for now.
const entityKind = ['service', 'route', 'consumer', 'consumer_group', 'certificate'] as const
export type EntityKind = (typeof entityKind)[number]
const entityKindSet = Object.fromEntries(entityKind.map(e => [`${e}s`, e]))

const defaultEntityLensConfig: EntityLensConfig[] = [
  { entity: 'service', keyPath: ['service'] },
  { entity: 'route', keyPath: ['route'] },
  { entity: 'consumer', keyPath: ['consumer'] },
  { entity: 'consumer_group', keyPath: ['consumer_group'] },
]

type EntityLensFieldKind = 'field'
type EntityLensCmdKind = 'cmd'

type MaybePromise<T> = T | Promise<T>

type EntityLensFieldDefinition<T> = {
  id: `${EntityLensFieldKind}/${string}`
  resolve: (cached: T) => MaybePromise<string | undefined>
}

type EntityLensCmdDefinition<T> = {
  id: `${EntityLensCmdKind}/${string}`
  resolve: (cached: T, id: string) => MaybePromise<languages.Command | undefined>
}

type EntityLensDefinition<T> = {
  title: string
  fields: Array<EntityLensFieldDefinition<T>>
  commands?: Array<EntityLensCmdDefinition<T>>
}

interface EntityDataMap {
  service: { data: { id: string, name: string } & Record<string, any> }
  route: { data: { id: string, name: string } & Record<string, any> }
  consumer: { data: { id: string, username?: string, custom_id?: string } & Record<string, any> }
  consumer_group: { data: { id: string, name: string } & Record<string, any> }
  certificate: { data: { id: string } & Record<string, any>, cert: X509Certificate }
}

type EntityLensDataMap = {
  [K in EntityKind]: EntityLensDefinition<EntityDataMap[K]>
}

function createEntityLensDefs(t: ReturnType<typeof useI18n>['i18n']['t']): EntityLensDataMap {
  const entityTitle = (kind: EntityKind) => t(`plugins.free-form.code-lens.entity.${kind}`)
  const fieldName = (value: string, entity: string) => t('plugins.free-form.code-lens.field.name', { value, entity })

  return {
    service: {
      title: entityTitle('service'),
      fields: [{
        id: 'field/name',
        resolve: c => c.data.name ? fieldName(c.data.name, entityTitle('service')) : undefined,
      }],
    },
    route: {
      title: entityTitle('route'),
      fields: [{
        id: 'field/name',
        resolve: c => c.data.name ? fieldName(c.data.name, entityTitle('route')) : undefined,
      }],
    },
    consumer_group: {
      title: entityTitle('consumer_group'),
      fields: [{
        id: 'field/name',
        resolve: c => c.data.name ? fieldName(c.data.name, entityTitle('consumer_group')) : undefined,
      }],
    },
    consumer: {
      title: entityTitle('consumer'),
      fields: [
        {
          id: 'field/username',
          resolve: c => c.data.username ? t('plugins.free-form.code-lens.field.username', { value: c.data.username }) : undefined,
        },
        {
          id: 'field/customId',
          resolve: c => c.data.custom_id ? t('plugins.free-form.code-lens.field.custom_id', { value: c.data.custom_id }) : undefined,
        },
      ],
    },
    certificate: {
      title: entityTitle('certificate'),
      fields: [
        {
          id: 'field/subject',
          resolve: async (c) => {
            if (!c) return
            return t('plugins.free-form.code-lens.field.subject', { value: c.cert.subject })
          },
        },
        {
          id: 'field/notAfter',
          resolve: async c => {
            if (!c) return
            return t('plugins.free-form.code-lens.field.expires_after', { value: c.cert.notAfter.toLocaleString('en') })
          },
        },
      ],
      commands: [
        {
          id: 'cmd/copyCert',
          resolve: (c, id) => c.cert
            ? {
              id,
              title: t('plugins.free-form.code-lens.action.copy_certificate'),
              arguments: [c.cert],
            } : undefined,
        },
      ],
    },
  }
}

export function buildForeignEntityLensConfig(
  schemaMap: Record<string, UnionFieldSchema>,
): Array<{ entity: EntityKind, keyPath: string[] }> {
  const results: Array<{ entity: EntityKind, keyPath: string[] }> = []
  for (const [keyPath, fieldSchema] of Object.entries(schemaMap)) {
    if (fieldSchema.type !== 'foreign') continue

    const ref = (fieldSchema as ForeignFieldSchema).reference
    if (!Object.prototype.hasOwnProperty.call(entityKindSet, ref)) continue

    results.push({
      entity: entityKindSet[ref],
      keyPath: keyPath.split('.'),
    })
  }
  return results
}

function buildEntityUrl(config: PluginFormConfig, entity: `${EntityKind}s`, entityId: string): string {
  let url = `${config.apiBaseUrl}${endpoints.form[config.app].entityGetOne}`

  if (config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, config.controlPlaneId || '')
  } else if (config.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, config.workspace ? `/${config.workspace}` : '')
  }

  url = url.replace(/{entity}/gi, entity).replace(/{id}/gi, entityId)

  return url
}

function normalizeTimestampValue(value: unknown): number {
  const timestamp = Number(value)
  if (!Number.isFinite(timestamp)) {
    return timestamp
  }
  return Math.abs(timestamp) < 1e12 ? timestamp * 1000 : timestamp
}

function createTimestampCodeLensProvider(keyPath: string): languages.CodeLensProvider {
  return createYAMLValueCodeLensProvider([keyPath], (value: unknown, range: IRange) => ({
    lenses: [{
      range,
      command: {
        id: '',
        title: `$(calendar)\u00A0${new Date(normalizeTimestampValue(value)).toLocaleString('en', { dateStyle: 'full', timeStyle: 'full' })}`,
      },
    }],
    dispose: () => {},
  }))
}

export function useCodeLensProviders(config: PluginFormConfig, axiosConfig?: AxiosRequestConfig, schema?: FormSchema) {
  const commandIdPrefix = `kong.entities-plugins.codeEditor.command.${nanoid()}`

  const commandIdCopy = `${commandIdPrefix}.copy`
  const commandIdViewEntity = `${commandIdPrefix}.viewEntity`

  const { axiosInstance } = useAxios(axiosConfig ?? config.axiosRequestConfig)
  const router = useRouter()
  const { i18n: { t } } = useI18n()

  const entityLensDefs = createEntityLensDefs(t)

  function createEntityCodeLensProvider(entity: EntityKind, keyPath?: string[]) {
    const cache = new Map<string, Promise<EntityDataMap[typeof entity]>>()
    const reloadEmitter = new Emitter<languages.CodeLensProvider>()

    const commandIdReloadProvider = `${commandIdPrefix}.${entity}.reloadCodeLensProvider`

    const innerProvider = createYAMLValueCodeLensProvider<{ id: string }>(keyPath ?? [entity], async (value, range) => {
      const entityId = value?.id
      if (!entityId) {
        return emptyCodeLensList()
      }

      if (!cache.has(entityId)) {
        cache.set( entityId, (async () => {
          const url = buildEntityUrl(config, `${entity}s`, entityId)
          const res = await axiosInstance.get(url)
          if (res.status < 200 || res.status >= 300) {
            throw new Error(res.statusText)
          }

          if (entity === 'consumer_group' && res.data?.consumer_group) {
            return { data: res.data.consumer_group } satisfies EntityDataMap[typeof entity]
          }

          // Parse certificate, and offer it as a sidecar field.
          if (entity === 'certificate') {
            const cert = res.data?.cert
            if (!cert) {
              throw new Error('Missing certificate')
            }

            await import('reflect-metadata')
            const { X509Certificate } = await import('@peculiar/x509')

            return {
              data: res.data,
              cert: new X509Certificate(cert),
            } satisfies EntityDataMap[typeof entity]
          }

          return { data: res.data } satisfies EntityDataMap[typeof entity]
        })())
      }

      const def = entityLensDefs[entity]
      const lenses: languages.CodeLens[] = [
        ...def.fields.map(f => ({ id: `${entityId}:${f.id}`, range })),
        {
          range,
          command: {
            id: commandIdViewEntity,
            title: `${t('plugins.free-form.code-lens.action.view_entity', { title: def.title })}\u00A0$(link-external)`,
            arguments: [entity, entityId],
          },
        },
        ...(def.commands ?? []).map(a => ({ id: `${entityId}:${a.id}`, range })),
      ]

      return { lenses, dispose: () => {} }
    })

    const provider: languages.CodeLensProvider = {
      provideCodeLenses: innerProvider.provideCodeLenses,
      resolveCodeLens: async (model, codeLens, token) => {
        const lens = (innerProvider.resolveCodeLens && await innerProvider.resolveCodeLens(model, codeLens, token)) ?? codeLens
        if (!lens.id) return lens

        const indexColon = lens.id.indexOf(':')
        const indexSlash = lens.id.indexOf('/')
        const entityId = lens.id.substring(0, indexColon)
        const kind = lens.id.substring(indexColon + 1, indexSlash) as EntityLensFieldKind | EntityLensCmdKind

        try {
          const cached = await cache.get(entityId)
          if (!cached) {
            throw new Error('Expected the cached entity to be non-empty')
          }

          const def = entityLensDefs[entity] as EntityLensDefinition<EntityDataMap[typeof entity]>
          const lensKey = lens.id.substring(indexColon + 1)

          switch (kind) {
            case 'field': {
              const fieldDef = def.fields.find(f => f.id === lensKey)
              const title = await fieldDef?.resolve(cached)
              if (title) {
                codeLens.command = { id: '', title }
              }
              break
            }
            case 'cmd': {
              const cmdDef = def.commands?.find(a => a.id === lensKey)
              const result = await cmdDef?.resolve(cached, commandIdCopy)
              if (result) {
                codeLens.command = result
              }
              break
            }
          }
        } catch (e) {
          console.error('Error resolving code lens:', e)
          codeLens.command = {
            id: commandIdReloadProvider,
            title: `$(warning)\u00A0${t('plugins.free-form.code-lens.action.retry_fetch')}`,
            arguments: [entityId],
            tooltip: e instanceof Error ? e.message : t('plugins.free-form.code-lens.unknown_error'),
          }
        }

        return codeLens
      },
      onDidChange: reloadEmitter.event,
    }

    const reloadCommand = editor.registerCommand(commandIdReloadProvider, (_accessor, entityId) => {
      cache.delete(entityId)
      reloadEmitter.fire(provider)
    })

    return {
      provider,
      dispose: () => {
        reloadEmitter.dispose()
        reloadCommand.dispose()
      },
    }
  }

  function setup(model: editor.ITextModel) {
    modelProviderDisposables.get(model)?.()

    const disposables: IDisposable[] = [
      languages.registerCodeLensProvider(
        { language: 'yaml', scheme: model.uri.scheme, pattern: model.uri.path },
        collectCodeLensProviders([
          createYAMLCopyUUIDCodeLensProvider({
            copyCommandId: commandIdCopy,
            title: t('plugins.free-form.code-lens.action.copy_uuid'),
          }),
          createTimestampCodeLensProvider('created_at'),
          createTimestampCodeLensProvider('updated_at'),
        ]),
      ),
    ]

    const entityLensConfig = schema ? buildForeignEntityLensConfig(buildSchemaMap(schema)) : defaultEntityLensConfig
    for (const { entity, keyPath } of entityLensConfig) {
      const clProvider = createEntityCodeLensProvider(entity, keyPath)
      disposables.push(
        languages.registerCodeLensProvider(
          { language: 'yaml', scheme: model.uri.scheme, pattern: model.uri.path },
          clProvider.provider,
        ),
        { dispose: clProvider.dispose },
      )
    }

    const viewRouteBuilders: Record<EntityKind, ((id: string) => RouteLocationRaw) | undefined> = {
      service: config.viewServiceRoute,
      route: config.viewRouteRoute,
      consumer: config.viewConsumerRoute,
      consumer_group: config.viewConsumerGroupRoute,
      certificate: config.viewCertificateRoute,
    }

    disposables.push(
      editor.registerCommand(commandIdCopy, (_accessor, content) => {
        const text = String(content)
        if (!navigator.clipboard?.writeText) {
          console.warn('[useCodeLensProviders] Clipboard API is unavailable')
          return
        }
        void navigator.clipboard.writeText(text).catch((e) => {
          console.warn('[useCodeLensProviders] Failed to copy to clipboard:', e)
        })
      }),
      editor.registerCommand(commandIdViewEntity, (_accessor, entity: EntityKind, entityId) => {
        const route = viewRouteBuilders[entity]?.(entityId)
        if (route) {
          window.open(router.resolve(route).href, '_blank', 'noopener')
        }
      }),
    )

    const dispose = () => {
      modelProviderDisposables.delete(model)
      disposables.splice(0, disposables.length).forEach(d => {
        try {
          d.dispose()
        } catch (e) {
          console.warn('[useCodeLensProviders] Failed to dispose:', e)
        }
      })
    }

    modelProviderDisposables.set(model, dispose)
    model.onWillDispose(dispose)

    return dispose
  }

  return {
    setup,
  }
}
