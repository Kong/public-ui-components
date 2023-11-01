export const options = [{
  text: 'Last 5 Minutes',
  value: {
    text: 'Last 5 Minutes',
    timeFrameLength: 300,
    stepSize: 1,
    param: 'seconds',
    ticksMod: 60,
    refreshInterval: 10000,
  },
}, {
  text: 'Last 30 Minutes',
  value: {
    text: 'Last 30 Minutes',
    timeFrameLength: 1800,
    stepSize: 60,
    param: 'minutes',
    ticksMod: 300,
    refreshInterval: 30000,
  },
}, {
  text: 'Last 60 Minutes',
  value: {
    text: 'Last 60 Minutes',
    timeFrameLength: 3600,
    stepSize: 60,
    param: 'minutes',
    ticksMod: 900,
    refreshInterval: 60000,
  },
}, {
  text: 'Last 6 Hours',
  value: {
    text: 'Last 6 Hours',
    timeFrameLength: 21600,
    stepSize: 60,
    param: 'minutes',
    ticksMod: 3600,
    refreshInterval: 360000,
  },
}, {
  text: 'Last 12 Hours',
  value: {
    text: 'Last 12 Hours',
    timeFrameLength: 43200,
    stepSize: 60,
    param: 'minutes',
    ticksMod: 7200,
    refreshInterval: 720000,
  },
}, {
  text: 'Last 24 Hours',
  value: {
    text: 'Last 24 Hours',
    timeFrameLength: 86400,
    stepSize: 60,
    param: 'minutes',
    ticksMod: 14400,
    refreshInterval: 9999999,
  },
}, {
  text: 'Last 7 Days',
  value: {
    text: 'Last 7 Days',
    timeFrameLength: 86400 * 7,
    stepSize: 3600,
    param: 'hours',
    ticksMod: 14400 * 7,
    refreshInterval: 9999999,
  },
}, {
  text: 'Last 30 Days',
  value: {
    text: 'Last 30 Days',
    timeFrameLength: 86400 * 30,
    stepSize: 3600,
    param: 'hours',
    ticksMod: 14400 * 30,
    refreshInterval: 9999999,
  },
}, {
  text: 'Last 90 Days',
  value: {
    text: 'Last 90 Days',
    timeFrameLength: 86400 * 90,
    stepSize: 3600 * 24,
    param: 'days',
    ticksMod: 14400 * 90,
    refreshInterval: 9999999,
  },
}, {
  text: 'Last 180 Days',
  value: {
    text: 'Last 180 Days',
    timeFrameLength: 86400 * 180,
    stepSize: 3600 * 24,
    param: 'days',
    ticksMod: 14400 * 180,
    refreshInterval: 9999999,
  },
}, {
  text: 'Last Year',
  value: {
    text: 'Last Year',
    timeFrameLength: 86400 * 365,
    stepSize: 3600 * 24,
    param: 'days',
    ticksMod: 14400 * 100,
    refreshInterval: 9999999,
  },
}, {
  text: 'Last 2 Years',
  value: {
    text: 'Last 2 Years',
    timeFrameLength: 86400 * 365 * 2,
    stepSize: 3600 * 24,
    param: 'days',
    ticksMod: 14400 * 200,
    refreshInterval: 9999999,
  },
}]
