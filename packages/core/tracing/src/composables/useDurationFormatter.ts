export default function useDurationFormatter(locales: Intl.LocalesArgument = 'en') {
  const numberFormatter = new Intl.NumberFormat(locales, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  return (nanoseconds: number) => {
    let t = nanoseconds

    if (t < 1000) {
      return `${numberFormatter.format(t)}ns`
    }

    if ((t /= 1000) < 1000) {
      return `${numberFormatter.format(t)}µs`
    }

    if ((t /= 1000) < 1000) {
      return `${numberFormatter.format(t)}ms`
    }

    if ((t /= 1000) < 1000) {
      return `${numberFormatter.format(t)}s`
    }

    if ((t /= 60) < 60) {
      return `${numberFormatter.format(t)}m`
    }

    return `${numberFormatter.format(t / 60)}h`
  }
}
