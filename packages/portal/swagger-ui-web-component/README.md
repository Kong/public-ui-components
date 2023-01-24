# swagger-ui-web-component

```html
<kong-swagger-ui url="https://petstore3.swagger.io/api/v3/openapi.json"></kong-swagger-ui>
```

---

Note: This package currently requires linking the [swagger-ui-kong-theme](https://github.com/Kong/swagger-ui-kong-theme) package locally.

1. Clone the `swagger-ui-kong-theme` repository and switch branch to `universal`
2. Run `yarn && yarn build && yarn link`
3. Go to your local clone directory of this repository and run `yarn link "@kong/swagger-ui-kong-theme"`
4. Run `yarn && yarn start`
5. Local development server should be running on http://localhost:9000
