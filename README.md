<div align="center">

# METRICON

**High-Throughput Link Infrastructure & Edge-Native Analytics Engine**  
_Engineered with Next.js 16 (App Router), React 19, TypeScript (Strict), Drizzle ORM, PostgreSQL, Upstash Redis, and Web Locks API._

[![Next.js 16](<https://img.shields.io/badge/Next.js-16.2_(App_Router)-000000?style=for-the-badge&logo=nextdotjs&logoColor=white>)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2_Concurrent-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x_Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-PostgreSQL-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Upstash Redis](https://img.shields.io/badge/Upstash-Edge_Ratelimit-00E599?style=for-the-badge&logo=redis&logoColor=white)](https://upstash.com/)
[![Stripe](https://img.shields.io/badge/Stripe-SaaS_Billing-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)

</div>

---

## Executive Summary

**Metricon** is a production-grade URL orchestration platform designed for high-concurrency environments. It replaces synchronous redirect bottlenecks with an edge-native routing pipeline, zero-cookie visitor attribution, and an offline-resilient dashboard backed by the browser's Web Locks API.

The engine executes geolocation filtering and device routing in sub-millisecond ranges, while offloading analytics ingestion to non-blocking background workers, guaranteeing instantaneous redirect speeds even under heavy analytical write loads.

---

## 🏛 System Architecture

The traffic engine decouples incoming client redirects from background analytics processing, guaranteeing zero I/O latency for visitors while maintaining strict database consistency.

> ### 1. Edge Ingestion & Fast Dispatch Layer
>
> **Client Request** ➔ **Next.js 16 Edge Route Engine**
>
> - 🟢 **Path A (Instant Redirect):** Resolves Device/Geo Target ➔ Dispatches HTTP `307/308` with **0ms wait time**
> - 🔵 **Path B (Non-Blocking Telemetry):** Next.js 16 `after()` runtime triggers background ingestion worker
>
> ─── _(Background Ingestion Stream)_ ───
>
> ### 2. Persistence & Multi-Tenant Fabric
>
> **PostgreSQL (Drizzle ORM) + Upstash Redis**
>
> - Hashes client IP with `IP_HASH_SALT` (zero-cookie GDPR attribution)
> - Commits atomic click increments and geo-telemetry to PostgreSQL
> - Sliding-window rate limit validation via Upstash Redis
>
> ─── _(Bi-Directional State Synchronization)_ ───
>
> ### 3. Client-Side Dashboard State Engine
>
> **Web UI ⟷ IndexedDB (`idb-keyval`) ⟷ Web Locks API**
>
> - Mutex lock (`sync_lock_${workspaceId}`) prevents cross-tab race conditions
> - Optimistic local updates synchronize seamlessly when connection is restored

### End-to-End Pipeline Execution

| Stage                      | Infrastructure Layer        | Technical Responsibility                                                                           |
| :------------------------- | :-------------------------- | :------------------------------------------------------------------------------------------------- |
| **1. Edge Resolution**     | Next.js 16 App Router       | Extracts geo-headers (`CF-IPCountry`), detects platform (`iOS`/`Android`), checks social crawlers. |
| **2. Instant Dispatch**    | Sub-millisecond Redirect    | Issues immediate HTTP 307/308 response to the client with zero database write delays.              |
| **3. Async Telemetry**     | Non-blocking `after()` Task | Hashes visitor IP with secret salt, gathers referrers, and atomically updates click tallies.       |
| **4. Offline Layer**       | Web Locks + IndexedDB       | Manages offline link creation and resolves sync conflicts safely across multiple open tabs.        |
| **5. Multi-Tenant Fabric** | PostgreSQL + Drizzle ORM    | Enforces tenant data isolation, role-based controls, and Stripe billing boundaries.                |

---

## ⚡ Core Engineering Challenges & Solutions

### 1. Zero-Latency Redirects via Non-Blocking Ingestion (`after()`)

- **Challenge**: Persisting analytics (IP resolution, geo-lookup, user-agent parsing, database insertion) synchronously before issuing a redirect response adds 100–250 ms of latency per visit.
- **Solution**: Decoupled the redirect response from the write pipeline using the Next.js 16 `after()` runtime API. The redirect header is returned immediately, while database transactions and atomic increment operations execute in the background:

```typescript
// Immediate client exit; database mutation runs asynchronously
after(async () => {
  await db.transaction(async (tx) => {
    await tx.insert(analytics).values({
      id: crypto.randomUUID(),
      linkId: link.id,
      country: country || "Unknown",
      referrer: referrer || "Direct",
      device: device || "Desktop",
      browser: browser || "Unknown",
      ipHash,
      timestamp: new Date(),
    });

    await tx.execute(sql`
      UPDATE links SET clicks_count = clicks_count + 1 WHERE id = ${link.id};
    `);
  });
});
```

### 2. Multi-Tab Resilient Offline Queue with Web Locks API

- **Challenge**: Managing campaigns in poor connectivity environments risks stale overrides and duplicate submissions if multiple dashboard tabs attempt to drain an offline queue simultaneously.
- **Solution**: Engineered a distributed client-side sync layer combining `idb-keyval` (IndexedDB) with the native **Web Locks API (`navigator.locks`)**:
  - Actions mutate local UI optimistically with distinct keys (`optimistic-*`).
  - Upon network reconnection, tabs request an exclusive mutex lock (`sync_lock_${workspaceId}`) to ensure single-worker execution.
  - Irrecoverable server errors (`LIMIT_REACHED`, `SHORT_CODE_EXISTS`) trigger targeted rollback and queue pruning without halting other valid actions.

### 3. GDPR-Compliant Zero-Cookie Identity Resolution

- **Challenge**: Tracking unique vs. total visitors traditionally relies on third-party cookies or storing raw IP addresses, introducing GDPR/ePrivacy compliance requirements.
- **Solution**: Designed a deterministic, one-way cryptographic hashing pipeline:

```text
Visitor_Hash = SHA-256( Client_IP + ":" + IP_HASH_SALT )
```

This enables accurate unique attribution (`COUNT(DISTINCT ip_hash)`) without storing raw network addresses or writing persistent tracking cookies to user devices.

### 4. SSRF-Protected Crawler & Social Card Scraper

- **Challenge**: URL shorteners shared across platforms like Slack, Discord, and X (Twitter) must return accurate OpenGraph previews without exposing internal infrastructure to Server-Side Request Forgery (SSRF).
- **Solution**: Built an isolated metadata scraper (`scrapeUrlMetadata`) with strict IP and protocol validation. Requests to loopback addresses (`127.0.0.1`, `localhost`), metadata IP blocks (`169.254.169.254`), and private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) are aborted immediately before fetching.

### 5. Multi-Tenant RBAC & Brute-Force Password Defense

- **Challenge**: Password-protected URLs and multi-member workspaces are common targets for dictionary attacks and privilege escalation.
- **Solution**:
  - Implemented server-only RBAC guards (`verifyWorkspaceAccess`) covering three discrete permission levels: `owner`, `admin`, and `viewer`.
  - Session verification uses constant-time string comparisons (`timingSafeEqual`) to eliminate timing-attack vulnerabilities.
  - Password gates track consecutive failed attempts per IP hash in PostgreSQL; reaching 5 failed attempts automatically triggers a 15-minute network lockout.

---

## 🎯 Platform Features

| Capability                 | Description                                                                                                  |
| :------------------------- | :----------------------------------------------------------------------------------------------------------- |
| **Hardware & Geo Routing** | Dynamic traffic splitting based on platform (`iOS`, `Android`, `Desktop`) and ISO country codes.             |
| **Link Access Controls**   | SHA-256 password gates, automated expiration timestamps, and click quotas.                                   |
| **Real-Time Telemetry**    | Area charts, geo-distribution tables, device breakdown metrics, and vector SVG/PNG QR generation.            |
| **Scheduled Digests**      | Automated HTML weekly performance summaries rendered server-side and dispatched via Resend.                  |
| **Headless REST API**      | `/api/v1/links` endpoints secured with SHA-256 Bearer tokens and sliding-window rate limits (Upstash Redis). |
| **SaaS Billing Engine**    | Multi-tier workspaces (`Free` vs `Pro`) integrated with Stripe Checkout, Webhooks, and Customer Portal.      |

---

## 🛡️ Architectural Specifications & Security Guarantees

| Dimension              | Conventional Link Shorteners                                      | Metricon Engine Solution                                                               | Technical Implementation                      |
| :--------------------- | :---------------------------------------------------------------- | :------------------------------------------------------------------------------------- | :-------------------------------------------- |
| **Redirect Overhead**  | Blocks response until analytics row is committed                  | **Zero I/O Wait Time:** Client receives instant 307/308 while writes run in background | Next.js 16 `after()` runtime                  |
| **Visitor Privacy**    | Invasive tracking cookies or raw IP storage (GDPR liability)      | **Zero-Cookie Attribution:** Deterministic non-reversible fingerprinting               | Salted SHA-256 IP hashing (`IP_HASH_SALT`)    |
| **Offline Resilience** | Operations fail immediately when offline; data lost on disconnect | **Deterministic Sync:** Actions queue locally and drain atomically across tabs         | Web Locks API (`navigator.locks`) + IndexedDB |
| **Link Preview (OG)**  | Vulnerable to internal network probing via OpenGraph previews     | **SSRF-Protected Scraper:** Blocks loopbacks, AWS metadata, and RFC 1918 subnets       | `scrapeUrlMetadata` with private IP isolation |
| **Protected Links**    | Vulnerable to automated brute-force credential stuffing           | **Rate-Limited Lockout:** Automated 15-minute lock after 5 consecutive failures        | PostgreSQL `failed_attempts` state tracking   |
| **API Defense**        | Static API keys vulnerable to denial-of-service                   | **Sliding Window Protection:** Enforces per-IP limits at the network edge              | Upstash Redis Sliding-Window Rate Limiter     |

---

## 🛠 Technology Stack

- **Framework & Runtime**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions) • [React 19](https://react.dev/) • [TypeScript 5](https://www.typescriptlang.org/)
- **Data Persistence & Cache**: [PostgreSQL](https://www.postgresql.org/) • [Drizzle ORM](https://orm.drizzle.team/) • [Upstash Redis](https://upstash.com/)
- **Offline & State Layer**: [idb-keyval](https://github.com/jakearchibald/idb-keyval) (IndexedDB) • Web Locks API (`navigator.locks`)
- **Styling & Components**: [Tailwind CSS v4](https://tailwindcss.com/) • [Radix UI](https://www.radix-ui.com/) • [Framer Motion](https://www.framer.com/motion/)
- **Billing & Communications**: [Stripe](https://stripe.com/) • [Resend](https://resend.com/)
- **Validation**: [Zod](https://zod.dev/)
