# @kong-ui-public/portal-analytics-bridge

This package is a Vue plugin that supplies the necessary mechanisms for analytics components to reach Konnect dev portal query APIs to obtain data.  This is the only supported way for analytics dashboards (created using the `DashboardRenderer` component) to obtain data.

Behind the scenes, this plugin uses provide / inject (under the key `analytics-query-provider`) to pass an object to all analytics dashboards within the app.  The dashboards will not function without this object.

**Note:** this package is specific to Konnect's dev portal.  Konnect itself uses different APIs and therefore has a different package.

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)

## Features

- Allow analytics components anywhere in the application to query the Explore API.
- Allow analytics components to determine user tier, for cases where it matters to the frontend.

## Requirements

To install the plugin, make the following changes to the `main.ts` file in the application that needs to query analytics:

```typescript
import portalAnalyticsBridge from '@kong-ui-public/portal-analytics-bridge'

// In the `initApp` function, before `app.mount`, add:
app.use(portalAnalyticsBridge, {
  axiosClient: '...'
})
```

`axiosClient` must be a properly configured Axios client:

- It must be configured to refresh auth tokens when necessary
- It must have the base URL set correctly.

## Usage

Once this package is installed and configured as described above, analytics dashboards should Just Work.  If they do not, please reach out to Kong for support.
