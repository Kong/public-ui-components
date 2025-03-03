// WeatherApi Gateway Service
export const demoWeatherService = {
  name: 'WeatherApi-quickstart-demo',
  tags: [
    'quickstart-demo',
  ],
  protocol: 'https',
  path: '/examples/weather/utopia',
  read_timeout: 60000,
  retries: 5,
  // will be overriden with correct host during DP node setup
  host: 'global.api.konghq.com',
  connect_timeout: 60000,
  ca_certificates: null,
  client_certificate: null,
  write_timeout: 60000,
  port: 443,
}

// GetWeather Route for WeatherApi Gateway Service
export const WEATHER_ROUTE_PATH = '/examples/weather/utopia'
export const demoWeatherRoute = {
  // this must be manually set
  /* service: {
    id: '5eeaed79-037a-4409-a2e3-7f9baf5b0ffa',
  }, */
  name: 'GetWeather-demo',
  paths: [
    WEATHER_ROUTE_PATH,
  ],
  snis: null,
  hosts: null,
  methods: [
    'GET',
    'OPTIONS',
  ],
  headers: null,
  sources: null,
  destinations: null,
  tags: [
    'quickstart-demo',
    'get',
  ],
  regex_priority: 0,
  path_handling: 'v0',
  strip_path: true,
  preserve_host: false,
  https_redirect_status_code: 426,
  protocols: [
    'http',
  ],
  request_buffering: true,
  response_buffering: true,
}

// StockApi Gateway Service
export const demoStockService = {
  name: 'StockApi-quickstart-demo',
  tags: [
    'quickstart-demo',
  ],
  protocol: 'https',
  path: '/examples/stock/piper',
  read_timeout: 60000,
  retries: 5,
  // will be overriden with correct host during DP node setup
  host: 'global.api.konghq.com',
  connect_timeout: 60000,
  ca_certificates: null,
  client_certificate: null,
  write_timeout: 60000,
  port: 443,
}

// GetStock Route for StockApi Gateway Service
export const STOCK_ROUTE_PATH = '/examples/stock/piper'
export const demoStockRoute = {
  // this must be manually set
  /* service: {
    id: '5eeaed79-037a-4409-a2e3-7f9baf5b0ffa',
  }, */
  name: 'GetStock-demo',
  paths: [
    STOCK_ROUTE_PATH,
  ],
  snis: null,
  hosts: null,
  methods: [
    'GET',
    'OPTIONS',
  ],
  headers: null,
  sources: null,
  destinations: null,
  tags: [
    'quickstart-demo',
    'get',
  ],
  regex_priority: 0,
  path_handling: 'v0',
  strip_path: true,
  preserve_host: false,
  https_redirect_status_code: 426,
  protocols: [
    'http',
  ],
  request_buffering: true,
  response_buffering: true,
}
