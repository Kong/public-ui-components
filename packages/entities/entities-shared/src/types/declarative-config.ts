export interface DeclarativePolicy {
  name: string
  id?: string
  condition?: string
  config: Record<string, any>
}

export interface DeclarativeListener {
  port: number
  protocol: string
  policies: DeclarativePolicy[]
}

export interface DeclarativeService {
  name: string
  policies: DeclarativePolicy[]
}

export interface DeclarativeRouteMatch {
  path: string
}

export interface DeclarativeRoute {
  name: string
  match: DeclarativeRouteMatch
  policies: DeclarativePolicy[]
}

export interface DeclarativeWasmComponent {
  name: string
  binary: string // base64 encoded binary
}

export interface DeclarativeConfig {
  listeners: DeclarativeListener[]
  routes: DeclarativeRoute[]
  services: DeclarativeService[]
  wasm_components?: DeclarativeWasmComponent[]
}

export type DeclarativeRouteSortableKey = keyof Pick<DeclarativeRoute, 'name' | 'match'>
