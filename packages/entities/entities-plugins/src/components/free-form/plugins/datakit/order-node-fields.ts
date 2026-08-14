function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function orderNodeFields(value: unknown): unknown {
  if (!isRecord(value) || !isRecord(value.config) || !Array.isArray(value.config.nodes)) return value

  return {
    ...value,
    config: {
      ...value.config,
      nodes: value.config.nodes.map((node) => {
        if (!isRecord(node)) return node

        return Object.fromEntries([
          ...['name', 'type']
            .filter(key => Object.hasOwn(node, key))
            .map(key => [key, node[key]]),
          ...Object.entries(node)
            .filter(([key]) => key !== 'name' && key !== 'type'),
        ])
      }),
    },
  }
}
