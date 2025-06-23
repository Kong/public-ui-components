## `useUrlValidator`

A composable utility that provides a suite of URL validation functions. This utility wraps the `useUrlValidators` singleton and makes it accessible via a simple function call, enabling consistent URL validation logic across your application.

### Usage

```ts
import { useUrlValidator } from '@kong-ui-public/entities-gateway-services'

const { validateHost, validatePort, validateProtocol, validatePath } = useUrlValidator()

const isHostValid = validateHost('example.com')
const isPortValid = validatePort('8080')
const isProtocolValid = validateProtocol('https')
const isPathValid = validatePath('/api/v1')
```

### Returned Validators

Each validator returns an **empty string (`''`) if the value is valid**, or a **descriptive error message (`string`) if invalid**.

- `validateHost(host: string): string` – Returns an error message if the host is invalid; returns `''` if valid.
- `validatePort(port: string | number): string` – Returns an error message if the port is out of range or malformed; returns `''` if valid.
- `validateProtocol(protocol: string): string` – Returns an error message if the protocol is not one of the supported types (e.g. `http`, `https`); returns `''` if valid.
- `validatePath(path: string): string` – Returns an error message if the path format is invalid; returns `''` if valid.
