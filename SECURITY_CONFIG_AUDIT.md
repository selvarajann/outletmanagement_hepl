# SECURITY & PRODUCTION CONFIGURATION AUDIT
## OutletManagement System — Vercel + Render + Aiven
**Audit Date:** 2026-08-12
**Scope:** All Java, JavaScript, JSON, properties, YAML, Dockerfile, scripts and configuration files
**Instruction:** Read-only audit. No files were modified.

---

> **IMPORTANT**: This report intentionally **does not print actual secret values**. File paths, line numbers, and variable names are provided so you can locate and act on each finding independently.

---

## Table of Contents

1. [Critical — Secrets Hardcoded in Source Code](#1-critical--secrets-hardcoded-in-source-code)
2. [Critical — Secrets in Git-Tracked Config Files](#2-critical--secrets-in-git-tracked-config-files)
3. [Critical — Secret Files Not in .gitignore](#3-critical--secret-files-not-in-gitignore)
4. [High — Hardcoded URLs in Business Logic](#4-high--hardcoded-urls-in-business-logic)
5. [High — Hardcoded URLs in Frontend](#5-high--hardcoded-urls-in-frontend)
6. [High — Dev Tunnel URLs in Production Code](#6-high--dev-tunnel-urls-in-production-code)
7. [High — Firebase Strategy Broken for Render](#7-high--firebase-strategy-broken-for-render)
8. [Medium — Weak or Missing Env-Var Defaults](#8-medium--weak-or-missing-env-var-defaults)
9. [Medium — CORS and WebSocket Misconfiguration](#9-medium--cors-and-websocket-misconfiguration)
10. [Medium — Console Leaks in Frontend](#10-medium--console-leaks-in-frontend)
11. [Low — Developer Noise in Production Build](#11-low--developer-noise-in-production-build)
12. [Environment Variables Master Checklist](#12-environment-variables-master-checklist)
13. [Files That Must Be Added to .gitignore](#13-files-that-must-be-added-to-gitignore)
14. [Safe-to-Remain-in-Source Configuration](#14-safe-to-remain-in-source-configuration)
15. [Git Commit Status Summary](#15-git-commit-status-summary)
16. [Priority Fix Order](#16-priority-fix-order)

---

## 1. Critical — Secrets Hardcoded in Source Code

### F-01 — JWT Signing Key (Static Constant)

| Field | Detail |
|-------|--------|
| **Finding ID** | F-01 |
| **Secret Name** | JWT HMAC Signing Key |
| **File** | `outletmanagement-main/src/main/java/com/example/outletmanagement/util/JwtUtil.java` |
| **Line** | 20 |
| **Value Type** | 64-character hex string hardcoded as `private static final String` |
| **Severity** | CRITICAL |
| **Problem** | Anyone who reads the source code or Git history can sign their own JWT tokens and impersonate any user including SUPER_ADMIN — bypassing all authentication. |
| **Committed to Git?** | YES — this is in a committed source file |
| **Must Rotate?** | YES — immediately after moving to env var. All existing JWTs will be invalidated (desired outcome). |
| **Recommended Env Var** | `JWT_SECRET` |
| **Where to Configure** | Render Dashboard → Environment Variables |
| **Code Fix** | Replace `private static final String SECRET_KEY = "..."` with `@Value("${JWT_SECRET}") private String secretKey;` and update `getSignKey()` to use the injected field. Add `JWT_SECRET=${JWT_SECRET}` to `application-prod.properties` with NO default value. |

---

### F-02 — Hardcoded JWT Access Tokens in Test/Dev Files

| Field | Detail |
|-------|--------|
| **Finding ID** | F-02 |
| **Secret Name** | Live JWT Access Tokens (ROLE_ADMIN) |
| **Files** | `TestPost.java` L12, `TestPost2.java` L12, `FetchShipments.java` L12-13 (all at project root) |
| **Value Type** | Full JWT bearer token string with ROLE_ADMIN payload |
| **Severity** | CRITICAL |
| **Problem** | Real ROLE_ADMIN JWT tokens are committed as string literals in dev test files at the repo root. Anyone who reads these files can replay the token against production until it expires or the secret is rotated. |
| **Committed to Git?** | YES |
| **Must Rotate?** | YES — rotate the JWT secret (F-01) which will immediately invalidate all existing tokens |
| **Recommended Env Var** | N/A — these files should be removed from the repo |
| **Code Fix** | Add all root-level test Java files to `.gitignore` and remove from Git tracking with `git rm --cached`. |

---

### F-03 — Sarvam AI API Key in Dev Properties

| Field | Detail |
|-------|--------|
| **Finding ID** | F-03 |
| **Secret Name** | Sarvam AI API Key |
| **File** | `outletmanagement-main/src/main/resources/application.properties` |
| **Line** | 5 |
| **Value Type** | `sk_` prefixed API key string (plain text) |
| **Severity** | CRITICAL |
| **Problem** | Real Sarvam AI API key stored in plain text in `application.properties`, a file typically committed to source control. Anyone can use this key to consume Sarvam AI at your account's expense. |
| **Committed to Git?** | YES |
| **Must Rotate?** | YES — go to Sarvam AI console, generate a new key, revoke the old one |
| **Recommended Env Var** | `SARVAM_API_KEY` |
| **Where to Configure** | Render Dashboard → Environment Variables |
| **Code Fix** | Change line 5 from literal value to `sarvam.ai.api-key=${SARVAM_API_KEY:}` (matching the pattern already used in `application-prod.properties`). |

---

### F-04 — SMTP Credentials in Dev Properties (Plain Text)

| Field | Detail |
|-------|--------|
| **Finding ID** | F-04 |
| **Secret Name** | Mailtrap SMTP Username + Password |
| **File** | `outletmanagement-main/src/main/resources/application.properties` |
| **Lines** | 66-67 |
| **Value Type** | Plain-text Mailtrap sandbox username and password |
| **Severity** | CRITICAL |
| **Problem** | Mailtrap sandbox credentials committed in plain text. The same credentials also appear as fallback defaults in `application-prod.properties` lines 58-59, meaning even the production profile has them embedded. |
| **Committed to Git?** | YES |
| **Must Rotate?** | YES — reset Mailtrap sandbox credentials from the Mailtrap dashboard |
| **Recommended Env Vars** | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` |
| **Where to Configure** | Render Dashboard → Environment Variables |
| **Code Fix** | In `application.properties`: replace literal values with `${SMTP_USER:}` / `${SMTP_PASSWORD:}`. In `application-prod.properties` lines 58-59: remove fallback defaults, making them `spring.mail.username=${SMTP_USER}` and `spring.mail.password=${SMTP_PASSWORD}` (no defaults). |

---

### F-05 — Firebase Service Account Private Key (Committed JSON File)

| Field | Detail |
|-------|--------|
| **Finding ID** | F-05 |
| **Secret Name** | Firebase Service Account RSA Private Key |
| **File** | `outletmanagement-main/src/main/resources/firebase-service-account.json` |
| **Lines** | 4-5 (private_key_id + private_key fields) |
| **Value Type** | RSA private key in PEM format + key ID |
| **Severity** | CRITICAL |
| **Problem** | The entire Firebase service account private key is in a JSON file inside `src/main/resources/`, which is compiled into the JAR AND committed to Git. Anyone can use this to send FCM push notifications, read Firebase data, or impersonate the service account. |
| **Committed to Git?** | YES — the file is in the resource directory and `.gitignore` does NOT exclude it |
| **Must Rotate?** | YES — Firebase Console → Project Settings → Service Accounts → Generate new private key → Revoke old key |
| **Recommended Env Var** | `FIREBASE_SERVICE_ACCOUNT_JSON` (entire JSON as a single-line string) |
| **Where to Configure** | Render Dashboard → Secret Files or Environment Variables |
| **Code Fix** | Refactor `FirebaseConfig.java` to read from env var string: inject `@Value("${FIREBASE_SERVICE_ACCOUNT_JSON:}")` and initialize with `GoogleCredentials.fromStream(new ByteArrayInputStream(json.getBytes()))`. Remove the JSON file from resources and add to `.gitignore`. |

---

### F-06 — Firebase Web SDK Config Hardcoded in Frontend

| Field | Detail |
|-------|--------|
| **Finding ID** | F-06 |
| **Secret Name** | Firebase Web API Key, App ID, Measurement ID |
| **File** | `frontend/src/config/firebase.js` |
| **Lines** | 11-17 |
| **Value Type** | Firebase web client configuration object (apiKey, appId, messagingSenderId, etc.) |
| **Severity** | LOW (by Firebase design — web config is public) |
| **Problem** | Values are hardcoded as string literals. Firebase web SDK config is intentionally public (security enforced via Firebase Security Rules), but externalizing to env vars allows project switching without code changes. |
| **Committed to Git?** | YES |
| **Must Rotate?** | NO — Firebase web SDK keys are public by design |
| **Recommended Env Vars** | `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID` |
| **Where to Configure** | Vercel Dashboard → Environment Variables |
| **Code Fix** | Replace hardcoded values with `import.meta.env.VITE_FIREBASE_*` and add corresponding values to `.env.production` and Vercel dashboard. |

---

## 2. Critical — Secrets in Git-Tracked Config Files

### F-07 — DB Password Default is a Weak Literal String

| Field | Detail |
|-------|--------|
| **Finding ID** | F-07 |
| **Secret Name** | MySQL Database Password |
| **File** | `outletmanagement-main/src/main/resources/application-prod.properties` |
| **Line** | 8 |
| **Value Type** | Fallback default `password` — a universally weak password |
| **Severity** | HIGH |
| **Problem** | `${DB_PASSWORD:password}` means if `DB_PASSWORD` env var is not set in Render, the app silently uses `password` as the database password. This could connect to a misconfigured or wrong database without any startup error. |
| **Committed to Git?** | YES (default value only) |
| **Must Rotate?** | NO — but remove the default |
| **Recommended Env Var** | `DB_PASSWORD` |
| **Code Fix** | Change `${DB_PASSWORD:password}` to `${DB_PASSWORD}` (no default) so the app fails fast at startup if the env var is not set. |

---

### F-08 — SMTP Password Default in Production Properties File

| Field | Detail |
|-------|--------|
| **Finding ID** | F-08 |
| **Secret Name** | Mailtrap SMTP Password (production fallback default) |
| **File** | `outletmanagement-main/src/main/resources/application-prod.properties` |
| **Lines** | 58-59 |
| **Value Type** | Real Mailtrap sandbox credentials as fallback defaults in production profile |
| **Severity** | CRITICAL |
| **Problem** | The production properties file still contains real Mailtrap sandbox credentials as defaults. If SMTP env vars are not set, production sends email through a sandbox — AND these credentials are committed to source control. |
| **Committed to Git?** | YES |
| **Must Rotate?** | YES — see F-04 |
| **Recommended Env Vars** | `SMTP_USER`, `SMTP_PASSWORD` |
| **Code Fix** | Remove defaults: `${SMTP_USER:abcf4f8b5be026}` → `${SMTP_USER}` and `${SMTP_PASSWORD:84550cc61905c1}` → `${SMTP_PASSWORD}`. |

---

### F-09 — IMS Dev Tunnel URL as Production Default

| Field | Detail |
|-------|--------|
| **Finding ID** | F-09 |
| **Secret Name** | IMS Base URL |
| **Files** | `application-prod.properties` L49, `application.properties` L77 |
| **Value Type** | Microsoft Dev Tunnels URL `https://flsrkbvh-8080.inc1.devtunnels.ms` as fallback default |
| **Severity** | HIGH |
| **Problem** | If `IMS_BASE_URL` is not set in Render, the production app silently calls a dev tunnel that is no longer running. IMS integration (order push, stock returns) will fail without any configuration error at startup. |
| **Committed to Git?** | YES |
| **Must Rotate?** | NO — but the default must be removed |
| **Recommended Env Var** | `IMS_BASE_URL` |
| **Code Fix** | Change default to empty string: `${IMS_BASE_URL:}` and add null/blank validation at startup. |

---

### F-10 — Webhook Secret Has Weak Predictable Default

| Field | Detail |
|-------|--------|
| **Finding ID** | F-10 |
| **Secret Name** | IMS Webhook Secret |
| **File** | `outletmanagement-main/src/main/java/com/example/outletmanagement/controller/ImsWebhookController.java` |
| **Line** | 35 |
| **Value Type** | Default string `oms-webhook-secret-2025` (predictable, publicly known) |
| **Severity** | HIGH |
| **Problem** | The webhook secret default is a predictable string committed in source code. Any attacker who reads the source can forge IMS webhook calls and trigger order dispatch without authorization. |
| **Committed to Git?** | YES (default value only) |
| **Must Rotate?** | YES — generate a cryptographically random string (32+ chars) |
| **Recommended Env Var** | `IMS_WEBHOOK_SECRET` |
| **Where to Configure** | Render Dashboard |
| **Code Fix** | `@Value("${ims.webhook-secret:oms-webhook-secret-2025}")` → `@Value("${ims.webhook-secret}")`. Add `ims.webhook-secret=${IMS_WEBHOOK_SECRET}` to `application-prod.properties` with no default. |

---

## 3. Critical — Secret Files Not in .gitignore

### F-11 — firebase-service-account.json Not in .gitignore

| Field | Detail |
|-------|--------|
| **Finding ID** | F-11 |
| **File** | `outletmanagement-main/.gitignore` |
| **Severity** | CRITICAL |
| **Problem** | The backend `.gitignore` does NOT exclude `firebase-service-account.json`. Every time `git add .` is run, the private key file gets staged and committed. |
| **Action Required** | Add `src/main/resources/firebase-service-account.json` to `outletmanagement-main/.gitignore` |

---

### F-12 — Test Files with Hardcoded Credentials Not Excluded

| Field | Detail |
|-------|--------|
| **Finding ID** | F-12 |
| **Files** | `FetchShipments.java`, `TestPost.java`, `TestPost2.java`, `TestGetProducts.java` (project root) |
| **Severity** | CRITICAL |
| **Problem** | Dev test files containing hardcoded JWT tokens and dev tunnel URLs are not excluded from Git. They will be committed on every `git add .`. |
| **Action Required** | Add these file names to the root-level `.gitignore`. |

---

### F-13 — Log and Compile Error Files Not Excluded

| Field | Detail |
|-------|--------|
| **Finding ID** | F-13 |
| **Files** | `app.log`, `compile_errors.txt`, `compile_errors2.txt`, `compile_errors3.txt`, `test_logs.txt`, `test_logs2.txt`, `test_logs3.txt`, `testrunner_output.log`, `compile.log` |
| **Severity** | HIGH |
| **Problem** | Log files may contain API responses, SQL queries, user data, tokens, and sensitive error messages. They are not in `.gitignore` and pollute the repository. |
| **Action Required** | Add `*.log` and specific log file names to `.gitignore`. |

---

## 4. High — Hardcoded URLs in Business Logic

### F-14 — Password Reset Link Hardcoded to localhost:5173

| Field | Detail |
|-------|--------|
| **Finding ID** | F-14 |
| **File** | `outletmanagement-main/src/main/java/com/example/outletmanagement/service/impl/AuthServiceImpl.java` |
| **Line** | 189 |
| **Value Type** | Hardcoded string `http://localhost:5173/reset-password?token=` |
| **Severity** | HIGH |
| **Problem** | Password reset emails sent in production will contain broken localhost links. Users cannot reset their passwords. |
| **Recommended Env Var** | `FRONTEND_URL` |
| **Where to Configure** | Render Dashboard (backend needs the frontend URL to generate correct email links) |
| **Code Fix** | Add `@Value("${app.frontend-url:http://localhost:5173}") private String frontendUrl;` and use `frontendUrl + "/reset-password?token=" + token`. Add `app.frontend-url=${FRONTEND_URL:http://localhost:5173}` to `application-prod.properties`. |

---

### F-15 — Scheduler Email PDF Links Hardcoded to localhost:8080 (4 files)

| Field | Detail |
|-------|--------|
| **Finding ID** | F-15 |
| **Files** | `ReconciliationScheduler.java` L103, `ExpiryNotificationScheduler.java` L106, `DeadLetterAlertScheduler.java` L108, `AuditCleanupScheduler.java` L118 |
| **Value Type** | Hardcoded string `http://localhost:8080` prepended to PDF file paths |
| **Severity** | HIGH |
| **Problem** | Scheduled alert emails sent to admins contain PDF download links pointing to localhost:8080. All links are broken in production. |
| **Recommended Env Var** | `BACKEND_URL` |
| **Where to Configure** | Render Dashboard |
| **Code Fix** | Add `@Value("${app.backend-url:http://localhost:8080}") private String backendUrl;` to each scheduler class and replace the hardcoded string with `backendUrl + pdfUrl`. Add `app.backend-url=${BACKEND_URL:http://localhost:8080}` to `application-prod.properties`. |

---

### F-16 — IMS Dev Tunnel URL Hardcoded in InventoryApiClient (3 locations)

| Field | Detail |
|-------|--------|
| **Finding ID** | F-16 |
| **File** | `outletmanagement-main/src/main/java/com/example/outletmanagement/integration/InventoryApiClient.java` |
| **Lines** | 95, 163, 235 |
| **Value Type** | Hardcoded dev tunnel URL strings in three method bodies |
| **Severity** | CRITICAL |
| **Problem** | `pushStockRequest()`, `fetchWarehouseAvailabilityMap()`, and `fetchFullWarehouseProducts()` all use hardcoded dev tunnel URLs instead of the `imsBaseUrl` field that is already injected via `@Value`. The configured `IMS_BASE_URL` env var is completely ignored for these three methods. When the dev tunnel stops, these features break without any configuration change being possible. |
| **Recommended Env Var** | `IMS_BASE_URL` (already exists in render.yaml) |
| **Code Fix** | In all three methods, replace `String endpoint = "https://flsrkbvh-8080.inc1.devtunnels.ms/..."` with `String endpoint = imsBaseUrl + "/..."` using the already-injected `imsBaseUrl` field. |

---

### F-17 — Admin Email Default is Non-Existent Placeholder

| Field | Detail |
|-------|--------|
| **Finding ID** | F-17 |
| **Files** | `ReconciliationScheduler.java` L45, `ExpiryNotificationScheduler.java` L47, `DeadLetterAlertScheduler.java` L45, `AuditCleanupScheduler.java` L56 |
| **Value Type** | Placeholder email `admin@outletmanagement.com` as default |
| **Severity** | MEDIUM |
| **Problem** | Scheduled alert emails (dead letter reports, expiry warnings, audit cleanup reports, reconciliation reports) are sent to a non-existent email address. All critical alerts will be lost. |
| **Recommended Env Var** | `APP_ADMIN_EMAIL` |
| **Where to Configure** | Render Dashboard |
| **Code Fix** | Add `app.admin.email=${APP_ADMIN_EMAIL:admin@outletmanagement.com}` to `application-prod.properties`. Set the real admin email in Render Dashboard. |

---

## 5. High — Hardcoded URLs in Frontend

### F-18 — SystemJobs.jsx Download Button Uses localhost:8080

| Field | Detail |
|-------|--------|
| **Finding ID** | F-18 |
| **File** | `frontend/src/pages/SystemJobs.jsx` |
| **Line** | 100 |
| **Value Type** | Hardcoded string `http://localhost:8080/api/jobs/daily-sales-report/download` |
| **Severity** | HIGH |
| **Problem** | The "Download PDF" button opens a localhost URL. In Vercel production, the request goes nowhere (connection refused). |
| **Code Fix** | Replace with: `window.open((import.meta.env.VITE_API_BASE_URL || "") + "/api/jobs/daily-sales-report/download", "_blank")` |

---

### F-19 — SystemReports.jsx Download Link Uses localhost:8080

| Field | Detail |
|-------|--------|
| **Finding ID** | F-19 |
| **File** | `frontend/src/pages/SystemReports.jsx` |
| **Line** | 50 |
| **Value Type** | Template literal with hardcoded `http://localhost:8080` prefix |
| **Severity** | HIGH |
| **Problem** | Every report download link in the table points to localhost:8080. All download buttons in the System Reports page are broken in Vercel production. |
| **Code Fix** | Replace with: `` href={`${import.meta.env.VITE_API_BASE_URL || ""}${row.fileUrl}`} `` |

---

## 6. High — Dev Tunnel URLs in Production Code

### F-20 — CorsConfig Fallback Contains Dev Tunnel URL

| Field | Detail |
|-------|--------|
| **Finding ID** | F-20 |
| **File** | `outletmanagement-main/src/main/java/com/example/outletmanagement/config/CorsConfig.java` |
| **Line** | 16 |
| **Value Type** | Dev tunnel URL `https://70rgsz56-8080.inc1.devtunnels.ms` in @Value default |
| **Severity** | HIGH |
| **Problem** | If `CORS_ALLOWED_ORIGINS` env var is not set in Render, the fallback default includes localhost and the dev tunnel URL but NOT the Vercel production domain. Every API request from the Vercel frontend will be blocked by CORS. |
| **Recommended Env Var** | `CORS_ALLOWED_ORIGINS` (already in render.yaml) |
| **Code Fix** | Remove the dev tunnel from the default: `@Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000}")`. Set `CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app` in Render Dashboard. |

---

### F-21 — SwaggerConfig Lists Dev Tunnel as API Server

| Field | Detail |
|-------|--------|
| **Finding ID** | F-21 |
| **File** | `outletmanagement-main/src/main/java/com/example/outletmanagement/config/SwaggerConfig.java` |
| **Lines** | 39-40 |
| **Value Type** | Hardcoded `localhost:8080` and dev tunnel URL as OpenAPI server entries |
| **Severity** | MEDIUM |
| **Problem** | Swagger UI shows localhost as the primary server and a stale dev tunnel as secondary. The Render production URL is not listed. API testing via Swagger UI will fail in production. |
| **Code Fix** | Add the Render production URL: `new Server().url("https://outlet-management-api.onrender.com").description("Production server")`. Remove or conditionally hide dev URLs based on active profile. |

---

### F-22 — InventoryApiClient Sends Dev Tunnel Header on All Requests

| Field | Detail |
|-------|--------|
| **Finding ID** | F-22 |
| **File** | `outletmanagement-main/src/main/java/com/example/outletmanagement/integration/InventoryApiClient.java` |
| **Lines** | 106, 173, 245, 353 |
| **Value Type** | Custom header `X-DevTunnels-Skip-AntiPhishing-Page: true` |
| **Severity** | MEDIUM |
| **Problem** | A dev-tunnel-specific HTTP header is being sent on all IMS API calls in production. This reveals development infrastructure details and may cause unexpected behavior with a real IMS production server. |
| **Code Fix** | Remove all four occurrences of `headers.set("X-DevTunnels-Skip-AntiPhishing-Page", "true")`. This header is only relevant when the target URL is a dev tunnel. |

---

## 7. High — Firebase Strategy Broken for Render

### F-23 — Firebase JSON File Path Not Viable in Docker on Render

| Field | Detail |
|-------|--------|
| **Finding ID** | F-23 |
| **File** | `render.yaml` L42-43 |
| **Severity** | CRITICAL |
| **Problem** | `render.yaml` sets `FIREBASE_SERVICE_ACCOUNT_PATH: sync: false`, expecting the path to be set in Render Dashboard. But once the JSON file is removed from the repo (as required by F-05 fix), the Docker container will not contain the file. The env var will point to a non-existent path, causing Firebase initialization to silently fail or the app to crash at startup. |
| **Code Fix** | Switch from file-path strategy to JSON-string-in-env-var strategy. See F-05 code fix. Update `render.yaml` to replace `FIREBASE_SERVICE_ACCOUNT_PATH` with `FIREBASE_SERVICE_ACCOUNT_JSON`. |

---

## 8. Medium — Weak or Missing Env-Var Defaults

### F-24 — IMS Orders API Token Required But Has No Default

| Field | Detail |
|-------|--------|
| **Finding ID** | F-24 |
| **File** | `application-prod.properties` L51 |
| **Line** | 51 |
| **Value Type** | `${IMS_ORDERS_API_TOKEN}` — no default, required at runtime |
| **Severity** | HIGH |
| **Problem** | If `IMS_ORDERS_API_TOKEN` is not set in Render, all IMS order push calls will send no Authorization header, causing 401s from IMS. The system will silently fail on order approvals. |
| **Recommended Env Var** | `IMS_ORDERS_API_TOKEN` |
| **Where to Configure** | Render Dashboard (already listed as `sync: false` in render.yaml) |

---

### F-25 — ReconciliationServiceImpl Has Duplicate localhost IMS Default

| Field | Detail |
|-------|--------|
| **Finding ID** | F-25 |
| **File** | `outletmanagement-main/src/main/java/com/example/outletmanagement/service/impl/ReconciliationServiceImpl.java` |
| **Line** | 42 |
| **Value Type** | `@Value("${ims.base-url:http://localhost:8081}")` — localhost as default |
| **Severity** | HIGH |
| **Problem** | `ReconciliationServiceImpl` has its own independent `@Value` injection for `ims.base-url` with a `localhost:8081` default. If `IMS_BASE_URL` env var is not set, reconciliation calls go to localhost (which doesn't exist on Render). |
| **Code Fix** | Change to `@Value("${ims.base-url:}")` and add null/blank validation before making HTTP calls. |

---

## 9. Medium — CORS and WebSocket Misconfiguration

### F-26 — WebSocket URL Fallback is Wrong for Vercel Deployment

| Field | Detail |
|-------|--------|
| **Finding ID** | F-26 |
| **File** | `frontend/src/store/middleware/websocketMiddleware.jsx` |
| **Line** | 17 |
| **Value Type** | Hostname check: `"/ws"` as production fallback |
| **Severity** | HIGH |
| **Problem** | On Vercel, `window.location.hostname` is not "localhost", so the code uses `"/ws"` — resolving to `https://your-app.vercel.app/ws`. Vercel does not proxy WebSocket connections. The real WebSocket server is on Render. All real-time notifications will silently fail in production. |
| **Recommended Env Var** | `VITE_WS_URL` |
| **Where to Configure** | Vercel Dashboard + `frontend/.env.production` |
| **Code Fix** | Change to: `const wsUrl = import.meta.env.VITE_WS_URL || (window.location.hostname === "localhost" ? "http://localhost:8080/ws" : "");`. Add `VITE_WS_URL=https://outlet-management-api.onrender.com/ws` to `.env.production`. |

---

### F-27 — WebSocketConfig Allows All Origins (Wildcard)

| Field | Detail |
|-------|--------|
| **Finding ID** | F-27 |
| **File** | `outletmanagement-main/src/main/java/com/example/outletmanagement/config/WebSocketConfig.java` |
| **Line** | 29 |
| **Value Type** | `setAllowedOriginPatterns("*")` |
| **Severity** | MEDIUM |
| **Problem** | Any website on the internet can establish a WebSocket connection to your Render backend. This is overly permissive and should be restricted to the Vercel production domain and localhost. |
| **Code Fix** | Change to `setAllowedOriginPatterns("https://*.vercel.app", "http://localhost:*")` or inject from a `CORS_ALLOWED_ORIGINS` env var. |

---

## 10. Medium — Console Leaks in Frontend

### F-28 — FCM Device Token Logged to Browser Console

| Field | Detail |
|-------|--------|
| **Finding ID** | F-28 |
| **File** | `frontend/src/hooks/useFcmNotifications.jsx` |
| **Line** | 22 |
| **Value Type** | `console.log('FCM Token obtained:', token)` |
| **Severity** | HIGH |
| **Problem** | FCM device tokens are printed to the browser console in production. Anyone with DevTools access can copy the FCM token and use it to receive push notifications meant for that device or register the token in a malicious service. |
| **Code Fix** | Remove this `console.log` statement entirely. |

---

### F-29 — Firebase Initialization Logged to Console

| Field | Detail |
|-------|--------|
| **Finding ID** | F-29 |
| **File** | `frontend/src/config/firebase.js` |
| **Line** | 25 |
| **Value Type** | `console.log("Firebase initialized")` |
| **Severity** | MEDIUM |
| **Problem** | Leaks technology stack details in production browser console. Minor but informational leak. |
| **Code Fix** | Remove the `console.log` statement. |

---

### F-30 — FCM Message Payload Logged to Console

| Field | Detail |
|-------|--------|
| **Finding ID** | F-30 |
| **File** | `frontend/src/hooks/useFcmNotifications.jsx` |
| **Line** | 41 |
| **Value Type** | `console.log('Message received in foreground: ', payload)` |
| **Severity** | MEDIUM |
| **Problem** | Full notification payload (which may contain order codes, user names, inventory data) is logged to browser console in production. |
| **Code Fix** | Remove this `console.log` statement. |

---

## 11. Low — Developer Noise in Production Build

### F-31 — System.out.println("hi") in Main Application Class

| Field | Detail |
|-------|--------|
| **Finding ID** | F-31 |
| **File** | `outletmanagement-main/src/main/java/com/example/outletmanagement/Application.java` |
| **Line** | 22 |
| **Severity** | LOW |
| **Problem** | Debug print statement outputs "hi" to stdout on every application startup in production. Unprofessional and noisy in production logs. |
| **Code Fix** | Remove `System.out.println("hi")`. |

---

### F-32 — DEBUG SQL Logging in Dev Properties

| Field | Detail |
|-------|--------|
| **Finding ID** | F-32 |
| **File** | `outletmanagement-main/src/main/resources/application.properties` |
| **Lines** | 14-16 |
| **Severity** | LOW |
| **Problem** | `show-sql=true`, `hibernate.SQL=DEBUG`, `hibernate.orm.jdbc.bind=TRACE` in dev profile would expose all SQL queries and bind values. Safe because `application-prod.properties` correctly overrides these to WARN. Concern only if `SPRING_PROFILES_ACTIVE` is accidentally unset. |
| **Code Fix** | No action required for production (prod profile overrides correctly). Optionally remove from dev profile for added safety. |

---

### F-33 — @Data Annotation on Service Class

| Field | Detail |
|-------|--------|
| **Finding ID** | F-33 |
| **File** | `outletmanagement-main/src/main/java/com/example/outletmanagement/service/impl/AuthServiceImpl.java` |
| **Line** | 33 |
| **Severity** | LOW |
| **Problem** | `@Data` on a `@Service` class generates `toString()` which includes all field values. If the service object is accidentally logged (e.g., via an exception that includes the service reference), dependency state could be exposed. |
| **Code Fix** | Replace `@Data` with just `@RequiredArgsConstructor` (which is already present). |

---

## 12. Environment Variables Master Checklist

### Render Dashboard — Set These Before Deploying

| Env Var | Status in render.yaml | Priority | Notes |
|---------|----------------------|----------|-------|
| `DB_HOST` | sync: false | REQUIRED | Aiven MySQL hostname |
| `DB_PORT` | sync: false | REQUIRED | Aiven MySQL port |
| `DB_NAME` | sync: false | REQUIRED | Database name |
| `DB_USER` | sync: false | REQUIRED | Aiven MySQL user |
| `DB_PASSWORD` | sync: false | REQUIRED | Remove default `password` from prod properties (F-07) |
| `REDIS_HOST` | sync: false | REQUIRED | Aiven Redis hostname |
| `REDIS_PORT` | sync: false | REQUIRED | Aiven Redis port |
| `REDIS_PASSWORD` | sync: false | REQUIRED | Aiven Redis password |
| `SARVAM_API_KEY` | sync: false | REQUIRED | Rotate first (F-03) |
| `SMTP_HOST` | sync: false | REQUIRED | Production SMTP provider host |
| `SMTP_PORT` | sync: false | REQUIRED | Production SMTP port |
| `SMTP_USER` | sync: false | REQUIRED | Rotate Mailtrap creds first (F-04) |
| `SMTP_PASSWORD` | sync: false | REQUIRED | Rotate Mailtrap creds first (F-04) |
| `IMS_ORDERS_API_TOKEN` | sync: false | REQUIRED | IMS API bearer token |
| `CORS_ALLOWED_ORIGINS` | sync: false | REQUIRED | Set to your Vercel URL |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | NOT IN render.yaml — ADD IT | REQUIRED | Full JSON string — rotate key first (F-05) |
| `JWT_SECRET` | NOT IN render.yaml — ADD IT | REQUIRED | 64+ char random hex — rotate after adding |
| `FRONTEND_URL` | NOT IN render.yaml — ADD IT | HIGH | Your Vercel app URL (for reset emails) |
| `BACKEND_URL` | NOT IN render.yaml — ADD IT | HIGH | Your Render app URL (for scheduler emails) |
| `IMS_BASE_URL` | sync: false | HIGH | Real IMS production URL (remove dev tunnel) |
| `IMS_WEBHOOK_SECRET` | NOT IN render.yaml — ADD IT | HIGH | Cryptographically random string — rotate |
| `APP_ADMIN_EMAIL` | NOT IN render.yaml — ADD IT | MEDIUM | Real admin email for scheduler alerts |

### Vercel Dashboard — Set These for Frontend

| Env Var | Currently In | Priority | Notes |
|---------|-------------|----------|-------|
| `VITE_API_BASE_URL` | `.env.production` (correct value) | REQUIRED | Also add in Vercel dashboard for CI/CD |
| `VITE_WS_URL` | NOT SET — ADD IT | HIGH | Your Render WebSocket URL (F-26) |
| `VITE_FIREBASE_*` | Hardcoded in firebase.js | OPTIONAL | Externalize for flexibility (F-06) |

---

## 13. Files That Must Be Added to .gitignore

**`outletmanagement-main/.gitignore`** — Add:
```
# Firebase credentials — NEVER commit
src/main/resources/firebase-service-account.json

# Log files — may contain sensitive data
app.log
compile.log
compile_errors.txt
compile_errors2.txt
compile_errors3.txt
test_logs.txt
test_logs2.txt
test_logs3.txt
testrunner_output.log
*.log

# Scratch and local test files
scratch/
```

**Root-level `.gitignore`** (create at project root `outletmanagement-main/` level):
```
# Dev test files containing hardcoded credentials
FetchShipments.java
TestPost.java
TestPost2.java
TestGetProducts.java
Refactor.java
Refactor2.java
Refactor.class
Refactor2.class
TestPost.class
test_*.js
test_payload.json
uat_postman_collection.json
api-docs.json
node_modules/

# Secret files
*.env
.env
.env.*
firebase-service-account.json
```

**`frontend/.gitignore`** — Add:
```
# Local environment overrides
.env.local
.env.development.local
.env.test.local
.env.production.local
```

---

## 14. Safe to Remain in Source Configuration

The following values are safe in source control and do NOT need to be externalized:

| Item | File | Reason |
|------|------|--------|
| Sarvam AI base URL `https://api.sarvam.ai/v1/chat/completions` | `application-prod.properties` | Public API endpoint — not a secret |
| Rate limit configuration | `application.properties` | Business config — not sensitive |
| HikariCP pool sizes | `application-prod.properties` | Performance config — not sensitive |
| JPA batch sizes | `application.properties` | Performance tuning — not sensitive |
| Actuator endpoints list | `application-prod.properties` | Which endpoints are exposed — not credentials |
| Stock low-threshold and expiry-warning-days | `application.properties` | Business rules — not secrets |
| Mailtrap host `sandbox.smtp.mailtrap.io` | `application.properties` (dev) | Dev host name only — not a credential |
| Vercel SPA rewrite rule | `frontend/vercel.json` | Routing config — not sensitive |
| CORS allowed methods list | `CorsConfig.java` | Not sensitive |
| Vite build chunk config | `frontend/vite.config.js` | Build optimization — not sensitive |
| Firebase web config structure (field names) | `frontend/src/config/firebase.js` | Field names are public — values should be env vars |
| WebSocket endpoint path `/ws` | `WebSocketConfig.java` | Not sensitive |
| Swagger UI path `/swagger-ui.html` | `application.properties` | Not sensitive |
| IMS endpoint paths `/api/receipts`, `/api/inventory-snapshot` | `application-prod.properties` | Path patterns — not credentials |

---

## 15. Git Commit Status Summary

| Finding | Secret Type | Git Status | Action Required |
|---------|-------------|-----------|----------------|
| F-01 | JWT Signing Key | IN GIT (source file) | Rotate + externalize |
| F-02 | Live JWT Bearer Tokens | IN GIT (test files) | Rotate JWT secret, remove files from git |
| F-03 | Sarvam AI API Key | IN GIT (properties) | Rotate + externalize |
| F-04 | Mailtrap SMTP credentials | IN GIT (properties) | Rotate + externalize |
| F-05 | Firebase RSA Private Key | IN GIT (JSON file) | Rotate + externalize + add to .gitignore |
| F-06 | Firebase Web Config | IN GIT (intentionally public) | No rotation needed |
| F-07 | DB password weak default | IN GIT (default only) | Remove the default |
| F-08 | SMTP creds in prod default | IN GIT | Rotate + remove defaults |
| F-09 | Dev tunnel as IMS URL default | IN GIT | Remove the default |
| F-10 | Weak webhook secret default | IN GIT | Change to env var + rotate |
| F-11 | firebase-service-account.json not gitignored | IN GIT | Add to .gitignore + git rm --cached |
| F-12 | Test files with credentials | LIKELY IN GIT | Add to .gitignore + git rm --cached |
| F-13 | Log files | LIKELY IN GIT | Add to .gitignore + git rm --cached |

---

## 16. Priority Fix Order

Execute in this sequence to minimize security exposure time:

| Priority | Finding | Action Summary |
|----------|---------|----------------|
| 1 | F-05 | Rotate Firebase private key; refactor FirebaseConfig to use env var JSON string; add to .gitignore |
| 2 | F-01 | Move JWT secret to env var + rotate (invalidates all existing JWTs) |
| 3 | F-03 | Rotate Sarvam API key; remove from application.properties |
| 4 | F-04 + F-08 | Rotate Mailtrap credentials; remove all hardcoded SMTP values from both property files |
| 5 | F-11 + F-12 + F-13 | Update all .gitignore files; run git rm --cached on sensitive files |
| 6 | F-23 | Update render.yaml — replace FIREBASE_SERVICE_ACCOUNT_PATH with FIREBASE_SERVICE_ACCOUNT_JSON |
| 7 | F-16 | Fix hardcoded dev tunnel URLs in InventoryApiClient (3 method bodies) |
| 8 | F-14 | Fix password reset link using FRONTEND_URL env var |
| 9 | F-15 | Fix scheduler email PDF links using BACKEND_URL env var |
| 10 | F-18 + F-19 | Fix SystemJobs.jsx and SystemReports.jsx to use VITE_API_BASE_URL |
| 11 | F-26 | Fix WebSocket URL for Vercel; add VITE_WS_URL to .env.production |
| 12 | F-10 | Add IMS_WEBHOOK_SECRET to render.yaml; rotate and remove default |
| 13 | F-20 | Remove dev tunnel from CORS default in CorsConfig.java |
| 14 | All env vars | Set all required variables in Render Dashboard and Vercel Dashboard |
| 15 | F-02 + F-07 + F-09 | Tighten remaining property defaults |
| 16 | F-28 + F-29 + F-30 | Remove all console.log from frontend |
| 17 | F-31 | Remove System.out.println from Application.java |
| 18 | F-22 | Remove X-DevTunnels-Skip-AntiPhishing-Page header from IMS calls |
| 19 | F-27 | Restrict WebSocket allowed origins to Vercel domain |
| 20 | F-21 | Update SwaggerConfig server list with production URL |

---

*End of Security and Production Configuration Audit — OutletManagement System*
*Total Findings: 33 | Critical: 9 | High: 13 | Medium: 7 | Low: 4*