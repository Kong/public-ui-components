# Free-form Plugin Migration Report

> ⚠️ **Auto-generated — do not edit manually.**
> To regenerate: `pnpm --filter @kong-ui-public/entities-plugins report:ff-migration`
>
> Generated: 2026-07-14T08:00:57.431Z

## Summary

`██████▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒░░` **75%**
> █ complete · ▓ ready for release · ▒ in progress · ░ not started

| Metric | Count |
|--------|-------|
| 📦 Total Kong Inc plugins | **113** |
| ✅ Migrated | **85** |
| ⏳ Pending | **28** |

### Milestone Status

| Status | Count |
|--------|-------|
| ✅ Complete | **6** |
| 🚀 Ready for Release | **10** |
| 🔄 In Progress | **5** |
| ⏸️ Not Started | **2** |

---

## Milestones

<details>
<summary><strong>✅ M1 — Key Auth, Rate Limiting & Core Transformations — Complete (7/7)</strong></summary>

- ✅ `key-auth`
- ✅ `rate-limiting`
- ✅ `jwt`
- ✅ `route-transformer-advanced`
- ✅ `request-transformer`
- ✅ `basic-auth`
- ✅ `upstream-oauth`

</details>

---

<details>
<summary><strong>✅ M2 — CORS, ACL & Proxy Cache — Complete (5/5)</strong></summary>

- ✅ `cors`
- ✅ `acl`
- ✅ `proxy-cache`
- ✅ `proxy-cache-advanced`
- ✅ `response-transformer`

</details>

---

### 🚀 M3 — AI Proxy Core — Ready for Release (5/5)

- ✅ `ai-proxy-advanced`
- ✅ `ai-proxy`
- ✅ `ai-prompt-decorator`
- ✅ `ai-prompt-guard`
- ✅ `ai-rate-limiting-advanced`

---

<details>
<summary><strong>✅ M4 — Analytics & Monitoring Core — Complete (5/5)</strong></summary>

- ✅ `prometheus`
- ✅ `file-log`
- ✅ `http-log`
- ✅ `correlation-id`
- ✅ `opentelemetry`

</details>

---

<details>
<summary><strong>✅ M5 — Advanced Transformations & Serverless — Complete (4/4)</strong></summary>

- ✅ `request-transformer-advanced`
- ✅ `response-transformer-advanced`
- ✅ `aws-lambda`
- ✅ `exit-transformer`

</details>

---

### 🚀 M6 — Security & Serverless Functions — Ready for Release (5/5)

- ✅ `pre-function`
- ✅ `ip-restriction`
- ✅ `post-function`
- ✅ `bot-detection`
- ✅ `request-size-limiting`

---

### 🚀 M7 — AI Semantic & Transformers — Ready for Release (5/5)

- ✅ `ai-semantic-cache`
- ✅ `ai-prompt-template`
- ✅ `ai-semantic-prompt-guard`
- ✅ `ai-request-transformer`
- ✅ `ai-response-transformer`

---

<details>
<summary><strong>✅ M8 — JWT Signer, Datakit & Advanced Plugins — Complete (5/5)</strong></summary>

- ✅ `jwt-signer`
- ✅ `datakit`
- ✅ `request-callout`
- ✅ `ai-mcp-proxy`
- ✅ `service-protection`

</details>

---

<details>
<summary><strong>✅ M9 — Solace Integration — Complete (3/3)</strong></summary>

- ✅ `solace-consume`
- ✅ `solace-log`
- ✅ `solace-upstream`

</details>

---

### 🚀 M10 — Auth & Session — Ready for Release (5/5)

- ✅ `header-cert-auth`
- ✅ `jwe-decrypt`
- ✅ `mtls-auth`
- ✅ `oauth2`
- ✅ `session`

---

### 🚀 M11 — Traffic Control: Rate Limiting — Ready for Release (5/5)

- ✅ `rate-limiting-advanced`
- ✅ `response-ratelimiting`
- ✅ `graphql-rate-limiting-advanced`
- ✅ `redirect`
- ✅ `request-termination`

---

### 🚀 M12 — Traffic Control: Validation & Routing — Ready for Release (5/5)

- ✅ `request-validator`
- ✅ `canary`
- ✅ `mocking`
- ✅ `oas-validation`
- ✅ `route-by-header`

---

### 🚀 M13 — Traffic Control: WebSocket & Timeouts — Ready for Release (5/5)

- ✅ `websocket-size-limit`
- ✅ `websocket-validator`
- ✅ `xml-threat-protection`
- ✅ `upstream-timeout`
- ✅ `forward-proxy`

---

### 🚀 M14 — Traffic Control: Messaging & Access — Ready for Release (5/5)

- ✅ `ace`
- ✅ `confluent-consume`
- ✅ `kafka-consume`
- ✅ `standard-webhooks`
- ✅ `graphql-proxy-cache-advanced`

---

### 🚀 M15 — Analytics, Monitoring & Monetization — Ready for Release (5/5)

- ✅ `app-dynamics`
- ✅ `datadog`
- ✅ `statsd`
- ✅ `zipkin`
- ✅ `metering-and-billing`

---

### 🚀 M16 — Authentication: Extended Methods — Ready for Release (5/5)

- ✅ `hmac-auth`
- ✅ `key-auth-enc`
- ✅ `ldap-auth`
- ✅ `ldap-auth-advanced`
- ✅ `oauth2-introspection`

---

### 🔄 M17 — Authentication: OpenID & Enterprise — In Progress (2/3)

- ⏳ `openid-connect`
- ✅ `saml`
- ✅ `vault-auth`

---

### 🔄 M18 — Logging — In Progress (1/5)

- ✅ `kafka-log`
- ⏳ `loggly`
- ⏳ `syslog`
- ⏳ `tcp-log`
- ⏳ `udp-log`

---

### ⏸️ M19 — Security — Not Started (0/6)

- ⏳ `acme`
- ⏳ `injection-protection`
- ⏳ `json-threat-protection`
- ⏳ `opa`
- ⏳ `tls-handshake-modifier`
- ⏳ `tls-metadata-headers`

---

### 🔄 M20 — Transformations & Serverless — In Progress (1/4)

- ✅ `confluent`
- ⏳ `degraphql`
- ⏳ `grpc-gateway`
- ⏳ `grpc-web`

---

### 🔄 M21 — Transformations & Serverless (cont.) — In Progress (1/4)

- ⏳ `jq`
- ✅ `kafka-upstream`
- ⏳ `azure-functions`
- ⏳ `openwhisk`

---

### 🔄 M22 — AI: Guardrails — In Progress (1/5)

- ⏳ `ai-a2a-proxy`
- ⏳ `ai-aws-guardrails`
- ⏳ `ai-azure-content-safety`
- ✅ `ai-custom-guardrail`
- ⏳ `ai-gcp-model-armor`

---

### ⏸️ M23 — AI: Advanced Safety & RAG — Not Started (0/7)

- ⏳ `ai-llm-as-judge`
- ⏳ `ai-lakera-guard`
- ⏳ `ai-mcp-oauth2`
- ⏳ `ai-sanitizer`
- ⏳ `ai-prompt-compressor`
- ⏳ `ai-rag-injector`
- ⏳ `ai-semantic-response-guard`
