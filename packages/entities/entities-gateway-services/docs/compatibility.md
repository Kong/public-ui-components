# Compatibility in the Gateway Service entity

## Protocol

`'ws'` and `'wss'` are not valid values for the `protocol` field in Gateway Community Edition or before Gateway Enterprise Edition 3.0:
- In the `GatewayServiceForm` component, `'ws'` and `'wss'` are hidden from the `protocol` select dropdown.