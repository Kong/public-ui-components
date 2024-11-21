export const getDurationFormatter = (locales: Intl.LocalesArgument = 'en') => {
  const fmt = new Intl.NumberFormat(locales, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  return (nanoseconds: number) => {
    let t = nanoseconds

    if (t < 1000) {
      return `${fmt.format(t)}ns`
    }

    if ((t /= 1000) < 1000) {
      return `${fmt.format(t)}µs`
    }

    if ((t /= 1000) < 1000) {
      return `${fmt.format(t)}ms`
    }

    if ((t /= 1000) < 1000) {
      return `${fmt.format(t)}s`
    }

    if ((t /= 60) < 60) {
      return `${fmt.format(t)}m`
    }

    return `${fmt.format(t / 60)}h`
  }
}
