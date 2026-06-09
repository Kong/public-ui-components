type RowAttrs = Record<string, unknown>

type AppliedRowAttrsState = {
  classNames: string[]
  styleKeys: string[]
  otherAttrs: string[]
}

const ROW_ATTR_STATE = new WeakMap<HTMLElement, AppliedRowAttrsState>()

const normalizeClassNames = (value: unknown): string[] => {
  if (typeof value === 'string') {
    return value.split(/\s+/).filter(Boolean)
  }

  if (Array.isArray(value)) {
    return value.flatMap(item => normalizeClassNames(item))
  }

  if (value && typeof value === 'object') {
    return Object.entries(value)
      .filter(([, isActive]) => Boolean(isActive))
      .map(([className]) => className)
  }

  return []
}

const setStyleValue = (style: CSSStyleDeclaration, key: string, value: unknown) => {
  if (key.startsWith('--') || key.includes('-')) {
    style.setProperty(key, String(value))
    return
  }

  const typedStyle = style as CSSStyleDeclaration & Record<string, string>
  typedStyle[key] = String(value)
}

const removeStyleValue = (style: CSSStyleDeclaration, key: string) => {
  if (key.startsWith('--') || key.includes('-')) {
    style.removeProperty(key)
    return
  }

  const typedStyle = style as CSSStyleDeclaration & Record<string, string>
  typedStyle[key] = ''
}

const normalizeStyleEntries = (value: unknown): Array<[string, unknown]> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return []
  }

  return Object.entries(value)
}

export const patchRowAttrs = (
  element: HTMLElement | undefined,
  attrs: RowAttrs | null | undefined,
) => {
  if (!element) {
    return
  }

  const previous = ROW_ATTR_STATE.get(element) ?? {
    classNames: [],
    otherAttrs: [],
    styleKeys: [],
  }

  const nextClassNames = normalizeClassNames(attrs?.class)
  element.classList.remove(...previous.classNames)
  element.classList.add(...nextClassNames)

  const nextStyleEntries = normalizeStyleEntries(attrs?.style)
  const nextStyleKeys = nextStyleEntries
    .filter(([, value]) => value != null && value !== false)
    .map(([key]) => key)
  previous.styleKeys
    .filter(key => !nextStyleKeys.includes(key))
    .forEach(key => removeStyleValue(element.style, key))
  nextStyleEntries.forEach(([key, value]) => {
    if (value == null || value === false) {
      removeStyleValue(element.style, key)
      return
    }

    setStyleValue(element.style, key, value)
  })

  const nextOtherAttrs = new Set<string>()
  Object.entries(attrs ?? {}).forEach(([key, value]) => {
    if (key === 'class' || key === 'style') {
      return
    }

    if (value == null || value === false) {
      element.removeAttribute(key)
      return
    }

    nextOtherAttrs.add(key)
    element.setAttribute(key, String(value))
  })

  previous.otherAttrs
    .filter(attr => !nextOtherAttrs.has(attr))
    .forEach(attr => element.removeAttribute(attr))

  ROW_ATTR_STATE.set(element, {
    classNames: nextClassNames,
    otherAttrs: [...nextOtherAttrs],
    styleKeys: nextStyleKeys,
  })
}
