// WeatherApi Gateway Service
export const KongAirService = {
  name: 'WeatherApi-quickstart-demo',
  tags: [],
  protocol: 'https',
  path: '/flights',
  read_timeout: 60000,
  retries: 5,
  host: 'api.kong-air.com',
  connect_timeout: 60000,
  ca_certificates: null,
  client_certificate: null,
  write_timeout: 60000,
  port: 443,
}
