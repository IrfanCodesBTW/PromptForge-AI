# API Reference

> PromptForge AI v0.1.0 — Complete API Documentation

PromptForge AI exposes two API surfaces:

1. **Electron IPC API** — Internal communication between main and renderer processes
2. **Local HTTP API** — External REST API powered by Fastify for scripting, extensions, and MCP integration

---

## Part 1: Electron IPC API

### Overview

The IPC layer provides secure, type-safe communication between Electron's main process (Node.js) and the renderer process (React UI).

| Property | Value |
|----------|-------|
| Transport | Electron IPC (contextBridge) |
| Channel Prefix | `promptforge:` |
| Serialization | Structured Clone Algorithm |
| Security | contextIsolation + sandbox enabled |
| Type Safety | Full TypeScript interfaces via `@electron/remote` replacement |

### Security Model

All IPC communication flows through a **preload script** that exposes a controlled API surface via `contextBridge.exposeInMainWorld`. The renderer process never has direct access to Node.js APIs.

```typescript
// preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('promptforge', {
  enhance: (request: EnhanceRequest) =>
    ipcRenderer.invoke('promptforge:enhance', request),
  cancelEnhancement: (id: string) =>
    ipcRenderer.invoke('promptforge:enhance:cancel', id),
  // ... additional methods
} satisfies PromptForgeAPI);
```

### Exposed API Interface

```typescript
interface PromptForgeAPI {
  // Enhancement
  enhance(request: EnhanceRequest): Promise<EnhanceResponse>;
  cancelEnhancement(id: string): Promise<void>;

  // History
  getHistory(query: HistoryQuery): Promise<PaginatedResult<HistoryEntry>>;
  deleteHistory(ids: string[]): Promise<void>;
  toggleFavorite(id: string): Promise<boolean>;

  // Templates
  getTemplates(filter?: TemplateFilter): Promise<Template[]>;
  createTemplate(template: CreateTemplateDTO): Promise<Template>;
  updateTemplate(id: string, data: UpdateTemplateDTO): Promise<Template>;
  deleteTemplate(id: string): Promise<void>;

  // Providers
  getProviders(): Promise<Provider[]>;
  testProvider(id: string): Promise<ProviderHealth>;
  updateProvider(id: string, data: UpdateProviderDTO): Promise<Provider>;

  // Settings
  getSettings(): Promise<Settings>;
  updateSettings(partial: Partial<Settings>): Promise<Settings>;

  // Events (Main → Renderer)
  onEnhancementProgress(callback: (progress: ProgressEvent) => void): void;
  onSettingsChanged(callback: (settings: Settings) => void): void;
  onProviderStatus(callback: (status: ProviderStatusEvent) => void): void;
  onError(callback: (error: AppError) => void): void;
}
```

### IPC Channel Registry

| Channel | Direction | Payload | Description |
|---------|-----------|---------|-------------|
| `promptforge:enhance` | Renderer → Main | `EnhanceRequest` | Submit a prompt for AI enhancement |
| `promptforge:enhance:cancel` | Renderer → Main | `string` (id) | Cancel an in-progress enhancement |
| `promptforge:enhance:progress` | Main → Renderer | `ProgressEvent` | Stream enhancement progress updates |
| `promptforge:history:query` | Renderer → Main | `HistoryQuery` | Query prompt history with filters |
| `promptforge:history:delete` | Renderer → Main | `string[]` (ids) | Delete history entries by ID |
| `promptforge:history:favorite` | Renderer → Main | `string` (id) | Toggle favorite status on a history entry |
| `promptforge:templates:list` | Renderer → Main | `TemplateFilter?` | List templates with optional filter |
| `promptforge:templates:create` | Renderer → Main | `CreateTemplateDTO` | Create a new prompt template |
| `promptforge:templates:update` | Renderer → Main | `{ id, data: UpdateTemplateDTO }` | Update an existing template |
| `promptforge:templates:delete` | Renderer → Main | `string` (id) | Delete a template by ID |
| `promptforge:providers:list` | Renderer → Main | `void` | Get all configured AI providers |
| `promptforge:providers:test` | Renderer → Main | `string` (id) | Test provider connectivity and health |
| `promptforge:providers:update` | Renderer → Main | `{ id, data: UpdateProviderDTO }` | Update provider configuration |
| `promptforge:providers:status` | Main → Renderer | `ProviderStatusEvent` | Provider health status change event |
| `promptforge:settings:get` | Renderer → Main | `void` | Retrieve current application settings |
| `promptforge:settings:update` | Renderer → Main | `Partial<Settings>` | Update application settings |
| `promptforge:settings:changed` | Main → Renderer | `Settings` | Broadcast settings change to all windows |
| `promptforge:error` | Main → Renderer | `AppError` | Global error notification |
| `promptforge:clipboard:read` | Renderer → Main | `void` | Read current clipboard text content |
| `promptforge:clipboard:write` | Renderer → Main | `string` | Write enhanced text to clipboard |



### Type Definitions

#### EnhanceRequest

```typescript
interface EnhanceRequest {
  /** The original prompt text to enhance */
  text: string;
  /** Enhancement mode */
  mode: 'enhance' | 'expand' | 'compress' | 'custom';
  /** Optional template ID to use as enhancement strategy */
  template_id?: string;
  /** Target AI provider (uses default if omitted) */
  provider?: string;
  /** Specific model override */
  model?: string;
  /** Source application context */
  context?: {
    app_name: string;
    app_bundle_id?: string;
    content_type?: 'code' | 'prose' | 'chat' | 'email' | 'unknown';
  };
  /** Additional enhancement options */
  options?: {
    temperature?: number;
    max_tokens?: number;
    system_prompt?: string;
    preserve_formatting?: boolean;
  };
}
```

#### EnhanceResponse

```typescript
interface EnhanceResponse {
  /** Unique enhancement ID */
  id: string;
  /** Original input text */
  original_text: string;
  /** AI-enhanced output text */
  enhanced_text: string;
  /** Enhancement mode used */
  mode: 'enhance' | 'expand' | 'compress' | 'custom';
  /** Provider that processed the request */
  provider: string;
  /** Model used for enhancement */
  model: string;
  /** Template used (if any) */
  template_id?: string;
  /** Token usage statistics */
  tokens_used: {
    prompt: number;
    completion: number;
    total: number;
  };
  /** Processing time in milliseconds */
  latency_ms: number;
  /** ISO 8601 timestamp */
  created_at: string;
}
```

#### HistoryEntry

```typescript
interface HistoryEntry {
  /** Unique entry ID (ULID) */
  id: string;
  /** Original prompt text */
  original_text: string;
  /** Enhanced prompt text */
  enhanced_text: string;
  /** Enhancement mode used */
  mode: 'enhance' | 'expand' | 'compress' | 'custom';
  /** AI provider used */
  provider: string;
  /** Model used */
  model: string;
  /** Template used (if any) */
  template_id?: string;
  /** Source application name */
  source_app?: string;
  /** Whether this entry is favorited */
  is_favorite: boolean;
  /** Token usage */
  tokens_used: number;
  /** Processing latency in ms */
  latency_ms: number;
  /** ISO 8601 creation timestamp */
  created_at: string;
}
```

#### Template

```typescript
interface Template {
  /** Unique template ID (ULID) */
  id: string;
  /** Display name */
  name: string;
  /** Template description */
  description: string;
  /** Category for organization */
  category: string;
  /** System prompt template (supports {{variables}}) */
  system_prompt: string;
  /** User prompt wrapper (supports {{input}}) */
  user_prompt_template: string;
  /** Template variables schema */
  variables?: TemplateVariable[];
  /** Whether template is active */
  is_active: boolean;
  /** Usage count */
  usage_count: number;
  /** ISO 8601 timestamps */
  created_at: string;
  updated_at: string;
}

interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  label: string;
  default?: string | number | boolean;
  options?: string[]; // For 'select' type
  required: boolean;
}
```

#### Provider

```typescript
interface Provider {
  /** Provider identifier */
  id: string;
  /** Display name */
  name: string;
  /** Provider type */
  type: 'ollama' | 'groq' | 'openai' | 'gemini' | 'anthropic' | 'openrouter';
  /** Whether provider is enabled */
  enabled: boolean;
  /** Base URL for API calls */
  base_url: string;
  /** API key (masked in responses) */
  api_key?: string;
  /** Default model for this provider */
  default_model: string;
  /** Available models */
  available_models: string[];
  /** Current health status */
  status: 'up' | 'down' | 'unknown';
  /** Last health check timestamp */
  last_checked_at?: string;
}

interface ProviderHealth {
  /** Provider ID */
  id: string;
  /** Health status */
  status: 'up' | 'down';
  /** Response latency in ms */
  latency_ms: number;
  /** Available models count */
  models_available: number;
  /** Error message if down */
  error?: string;
}
```

#### Settings

```typescript
interface Settings {
  /** General settings */
  general: {
    launch_at_startup: boolean;
    minimize_to_tray: boolean;
    show_notifications: boolean;
    language: string;
    theme: 'light' | 'dark' | 'system';
  };
  /** Hotkey bindings */
  hotkeys: {
    enhance: string;
    expand: string;
    compress: string;
    palette: string;
    templates: string;
    history: string;
  };
  /** Default enhancement settings */
  enhancement: {
    default_provider: string;
    default_model: string;
    default_mode: 'enhance' | 'expand' | 'compress';
    auto_copy_result: boolean;
    auto_paste_result: boolean;
    stream_response: boolean;
  };
  /** Privacy settings */
  privacy: {
    store_history: boolean;
    history_retention_days: number;
    anonymize_on_export: boolean;
  };
  /** API settings */
  api: {
    enabled: boolean;
    port: number;
    token: string;
    rate_limit: number;
  };
}
```

#### HistoryQuery & PaginatedResult

```typescript
interface HistoryQuery {
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page (default: 20, max: 100) */
  limit?: number;
  /** Filter by enhancement mode */
  mode?: 'enhance' | 'expand' | 'compress' | 'custom';
  /** Filter by provider */
  provider?: string;
  /** Filter by category */
  category?: string;
  /** Filter favorites only */
  is_favorite?: boolean;
  /** Date range start (ISO 8601) */
  from?: string;
  /** Date range end (ISO 8601) */
  to?: string;
  /** Full-text search query */
  search?: string;
  /** Sort field */
  sort_by?: 'created_at' | 'tokens_used' | 'latency_ms';
  /** Sort direction */
  sort_order?: 'asc' | 'desc';
}

interface PaginatedResult<T> {
  /** Result items */
  data: T[];
  /** Total matching items */
  total: number;
  /** Current page (1-indexed) */
  page: number;
  /** Items per page */
  limit: number;
  /** Whether there are more pages */
  has_more: boolean;
}
```



---

## Part 2: Local HTTP API (Fastify)

### Overview

PromptForge AI runs a local Fastify HTTP server that enables external tools, scripts, and extensions to interact with the application programmatically.

| Property | Value |
|----------|-------|
| Base URL | `http://localhost:9876` |
| Protocol | HTTP/1.1 |
| Format | JSON (`application/json`) |
| Auth | Bearer token |
| Error Format | RFC 7807 Problem Details |
| Rate Limit | 100 requests/minute |
| CORS | `localhost` origins only |
| Streaming | Server-Sent Events (SSE) |

### Authentication

All API requests require a Bearer token in the `Authorization` header:

```
Authorization: Bearer pfg_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Finding your token:**
- **UI:** Settings → API → Local API Token
- **File:** `{userData}/api-token.txt`
- **CLI:** `promptforge token show`

The token is auto-generated on first application run. You can regenerate it via Settings or by deleting the token file and restarting.

**Example: Unauthorized Request**

```bash
curl http://localhost:9876/api/v1/health
```

```json
{
  "type": "https://promptforge.ai/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Missing or invalid Authorization header. Include 'Bearer <token>' in your request.",
  "instance": "/api/v1/health"
}
```

---

### Endpoints

#### `POST /api/v1/enhance`

Enhance a prompt using the configured AI provider.

**Request:**

```bash
curl -X POST http://localhost:9876/api/v1/enhance \
  -H "Authorization: Bearer pfg_a1b2c3d4..." \
  -H "Content-Type: application/json" \
  -d '{
    "text": "make a website that sells shoes",
    "mode": "enhance",
    "provider": "ollama",
    "model": "llama3.1"
  }'
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | `string` | ✅ | The prompt text to enhance |
| `mode` | `string` | ❌ | `enhance` (default), `expand`, `compress`, `custom` |
| `template_id` | `string` | ❌ | Template ID to use as enhancement strategy |
| `provider` | `string` | ❌ | Provider ID (uses default if omitted) |
| `model` | `string` | ❌ | Model override for the chosen provider |
| `options` | `object` | ❌ | Additional options (see below) |

**Options Object:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `temperature` | `number` | `0.7` | Sampling temperature (0.0–2.0) |
| `max_tokens` | `number` | `2048` | Maximum response tokens |
| `system_prompt` | `string` | — | Custom system prompt override |
| `preserve_formatting` | `boolean` | `true` | Maintain original formatting structure |

**Response (200 OK):**

```json
{
  "id": "01HZ9QK5M7XJVN3RTPW8BCDE42",
  "original_text": "make a website that sells shoes",
  "enhanced_text": "Design and develop a modern e-commerce website specializing in footwear sales. The site should include: a responsive product catalog with filtering by size, brand, and style; a streamlined checkout flow with guest checkout option; high-quality product imagery with zoom functionality; customer reviews and ratings; inventory management integration; and mobile-first responsive design. Target audience: fashion-conscious consumers aged 18-45.",
  "mode": "enhance",
  "provider": "ollama",
  "model": "llama3.1",
  "tokens_used": {
    "prompt": 45,
    "completion": 89,
    "total": 134
  },
  "latency_ms": 1247,
  "created_at": "2026-07-05T10:15:30.000Z"
}
```

**Streaming Response (SSE):**

To receive the enhanced text as a stream, set the `Accept` header to `text/event-stream`:

```bash
curl -X POST http://localhost:9876/api/v1/enhance \
  -H "Authorization: Bearer pfg_a1b2c3d4..." \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"text": "make a website that sells shoes", "mode": "enhance"}'
```

```
event: start
data: {"id": "01HZ9QK5M7XJVN3RTPW8BCDE42", "provider": "ollama", "model": "llama3.1"}

event: token
data: {"content": "Design and develop"}

event: token
data: {"content": " a modern e-commerce"}

event: token
data: {"content": " website specializing"}

event: done
data: {"tokens_used": {"prompt": 45, "completion": 89, "total": 134}, "latency_ms": 1247}
```

---

#### `GET /api/v1/templates`

List all prompt templates with optional filtering.

**Request:**

```bash
curl "http://localhost:9876/api/v1/templates?category=coding&is_active=true" \
  -H "Authorization: Bearer pfg_a1b2c3d4..."
```

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `category` | `string` | Filter by category name |
| `is_active` | `boolean` | Filter by active status |
| `search` | `string` | Search in name and description |

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "01HZ8ABC123DEF456GHI789JK",
      "name": "Code Review Enhancer",
      "description": "Transforms brief code review requests into comprehensive review prompts",
      "category": "coding",
      "system_prompt": "You are an expert code reviewer. Enhance the user's prompt to request a thorough code review covering: correctness, performance, security, readability, and maintainability.",
      "user_prompt_template": "Please review the following code with focus on {{focus_area}}: {{input}}",
      "variables": [
        {
          "name": "focus_area",
          "type": "select",
          "label": "Focus Area",
          "options": ["security", "performance", "readability", "all"],
          "default": "all",
          "required": false
        }
      ],
      "is_active": true,
      "usage_count": 42,
      "created_at": "2026-06-15T08:30:00.000Z",
      "updated_at": "2026-07-01T14:20:00.000Z"
    }
  ],
  "total": 1
}
```

---

#### `POST /api/v1/templates`

Create a new prompt template.

**Request:**

```bash
curl -X POST http://localhost:9876/api/v1/templates \
  -H "Authorization: Bearer pfg_a1b2c3d4..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Email Polisher",
    "description": "Makes email drafts more professional and concise",
    "category": "communication",
    "system_prompt": "You are a professional communication coach. Enhance the email to be clear, concise, and professional while maintaining the original intent.",
    "user_prompt_template": "Polish this email draft for a {{tone}} tone: {{input}}",
    "variables": [
      {
        "name": "tone",
        "type": "select",
        "label": "Tone",
        "options": ["formal", "friendly", "neutral"],
        "default": "professional",
        "required": true
      }
    ]
  }'
```

**Response (201 Created):**

```json
{
  "id": "01HZ9XYZ987WVU654TSR321QP",
  "name": "Email Polisher",
  "description": "Makes email drafts more professional and concise",
  "category": "communication",
  "system_prompt": "You are a professional communication coach...",
  "user_prompt_template": "Polish this email draft for a {{tone}} tone: {{input}}",
  "variables": [...],
  "is_active": true,
  "usage_count": 0,
  "created_at": "2026-07-05T10:20:00.000Z",
  "updated_at": "2026-07-05T10:20:00.000Z"
}
```



---

#### `GET /api/v1/history`

Query prompt enhancement history with pagination and filtering.

**Request:**

```bash
curl "http://localhost:9876/api/v1/history?page=1&limit=10&provider=ollama&is_favorite=true" \
  -H "Authorization: Bearer pfg_a1b2c3d4..."
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | `integer` | `1` | Page number (1-indexed) |
| `limit` | `integer` | `20` | Items per page (max: 100) |
| `mode` | `string` | — | Filter by mode: `enhance`, `expand`, `compress`, `custom` |
| `provider` | `string` | — | Filter by provider ID |
| `category` | `string` | — | Filter by template category |
| `is_favorite` | `boolean` | — | Filter favorites only |
| `from` | `string` | — | Start date (ISO 8601) |
| `to` | `string` | — | End date (ISO 8601) |
| `sort_by` | `string` | `created_at` | Sort field: `created_at`, `tokens_used`, `latency_ms` |
| `sort_order` | `string` | `desc` | Sort direction: `asc`, `desc` |

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "01HZ9QK5M7XJVN3RTPW8BCDE42",
      "original_text": "make a website that sells shoes",
      "enhanced_text": "Design and develop a modern e-commerce website...",
      "mode": "enhance",
      "provider": "ollama",
      "model": "llama3.1",
      "template_id": null,
      "source_app": "Visual Studio Code",
      "is_favorite": true,
      "tokens_used": 134,
      "latency_ms": 1247,
      "created_at": "2026-07-05T10:15:30.000Z"
    }
  ],
  "total": 156,
  "page": 1,
  "limit": 10,
  "has_more": true
}
```

---

#### `POST /api/v1/history/search`

Full-text search across prompt history.

**Request:**

```bash
curl -X POST http://localhost:9876/api/v1/history/search \
  -H "Authorization: Bearer pfg_a1b2c3d4..." \
  -H "Content-Type: application/json" \
  -d '{
    "query": "e-commerce website",
    "filters": {
      "provider": "ollama",
      "from": "2026-07-01T00:00:00.000Z",
      "is_favorite": true
    }
  }'
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | `string` | ✅ | Full-text search query |
| `filters` | `object` | ❌ | Additional filters (same as GET /history params) |

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "01HZ9QK5M7XJVN3RTPW8BCDE42",
      "original_text": "make a website that sells shoes",
      "enhanced_text": "Design and develop a modern e-commerce website...",
      "mode": "enhance",
      "provider": "ollama",
      "model": "llama3.1",
      "source_app": "Visual Studio Code",
      "is_favorite": true,
      "tokens_used": 134,
      "latency_ms": 1247,
      "created_at": "2026-07-05T10:15:30.000Z",
      "_score": 0.92
    }
  ],
  "total": 3
}
```

---

#### `DELETE /api/v1/history`

Delete history entries by ID.

**Request:**

```bash
curl -X DELETE http://localhost:9876/api/v1/history \
  -H "Authorization: Bearer pfg_a1b2c3d4..." \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["01HZ9QK5M7XJVN3RTPW8BCDE42", "01HZ8ABC123DEF456GHI789JK"]
  }'
```

**Response (200 OK):**

```json
{
  "deleted": 2
}
```

---

#### `GET /api/v1/providers`

List all configured AI providers with their current health status.

**Request:**

```bash
curl http://localhost:9876/api/v1/providers \
  -H "Authorization: Bearer pfg_a1b2c3d4..."
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "ollama",
      "name": "Ollama",
      "type": "ollama",
      "enabled": true,
      "base_url": "http://localhost:11434",
      "default_model": "llama3.1",
      "available_models": ["llama3.1", "codellama", "mistral", "phi3"],
      "status": "up",
      "latency_ms": 12,
      "last_checked_at": "2026-07-05T10:14:00.000Z"
    },
    {
      "id": "groq",
      "name": "Groq",
      "type": "groq",
      "enabled": true,
      "base_url": "https://api.groq.com/openai/v1",
      "api_key": "gsk_****...****",
      "default_model": "llama-3.1-70b-versatile",
      "available_models": ["llama-3.1-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
      "status": "up",
      "latency_ms": 89,
      "last_checked_at": "2026-07-05T10:14:00.000Z"
    },
    {
      "id": "openai",
      "name": "OpenAI",
      "type": "openai",
      "enabled": false,
      "base_url": "https://api.openai.com/v1",
      "api_key": null,
      "default_model": "gpt-4o",
      "available_models": [],
      "status": "unknown",
      "last_checked_at": null
    }
  ]
}
```

---

#### `POST /api/v1/providers/:id/test`

Test connectivity and health of a specific provider.

**Request:**

```bash
curl -X POST http://localhost:9876/api/v1/providers/ollama/test \
  -H "Authorization: Bearer pfg_a1b2c3d4..."
```

**Response (200 OK):**

```json
{
  "id": "ollama",
  "status": "up",
  "latency_ms": 15,
  "models_available": 4,
  "error": null
}
```

**Response (200 OK — Provider Down):**

```json
{
  "id": "ollama",
  "status": "down",
  "latency_ms": 5000,
  "models_available": 0,
  "error": "Connection refused: Ollama is not running on localhost:11434"
}
```

---

#### `GET /api/v1/health`

Application health check endpoint. Does not require authentication.

**Request:**

```bash
curl http://localhost:9876/api/v1/health
```

**Response (200 OK):**

```json
{
  "status": "ok",
  "version": "0.1.0",
  "uptime": 3600,
  "database": "connected",
  "providers": [
    { "name": "ollama", "status": "up" },
    { "name": "groq", "status": "up" },
    { "name": "openai", "status": "down" }
  ]
}
```

---

### Error Handling

All errors follow the [RFC 7807 Problem Details](https://www.rfc-editor.org/rfc/rfc7807) specification:

```json
{
  "type": "https://promptforge.ai/errors/{error-code}",
  "title": "Human-Readable Title",
  "status": 400,
  "detail": "Specific description of what went wrong",
  "instance": "/api/v1/enhance"
}
```

### Error Codes

| Code | Status | Title | Description |
|------|--------|-------|-------------|
| `bad-request` | 400 | Bad Request | Invalid request body or missing required fields |
| `validation-failed` | 400 | Validation Failed | Request body failed schema validation |
| `unauthorized` | 401 | Unauthorized | Missing or invalid Bearer token |
| `forbidden` | 403 | Forbidden | Valid token but insufficient permissions |
| `not-found` | 404 | Not Found | Requested resource does not exist |
| `conflict` | 409 | Conflict | Resource already exists (duplicate template name) |
| `text-too-long` | 413 | Payload Too Large | Input text exceeds maximum length (50,000 characters) |
| `rate-limited` | 429 | Too Many Requests | Rate limit exceeded, retry after cooldown |
| `provider-unavailable` | 503 | Provider Unavailable | Selected AI provider is not reachable |
| `provider-error` | 502 | Provider Error | AI provider returned an unexpected error |
| `provider-timeout` | 504 | Provider Timeout | AI provider did not respond within timeout |
| `enhancement-cancelled` | 499 | Enhancement Cancelled | Enhancement was cancelled by the user |
| `internal-error` | 500 | Internal Server Error | Unexpected application error |

**Example: Validation Error**

```json
{
  "type": "https://promptforge.ai/errors/validation-failed",
  "title": "Validation Failed",
  "status": 400,
  "detail": "Request body validation failed",
  "instance": "/api/v1/enhance",
  "errors": [
    {
      "field": "text",
      "message": "Required field 'text' is missing"
    },
    {
      "field": "mode",
      "message": "Invalid value 'summarize'. Must be one of: enhance, expand, compress, custom"
    }
  ]
}
```

**Example: Provider Unavailable**

```json
{
  "type": "https://promptforge.ai/errors/provider-unavailable",
  "title": "Provider Unavailable",
  "status": 503,
  "detail": "Ollama is not running on localhost:11434. Please start Ollama and try again.",
  "instance": "/api/v1/enhance",
  "provider": "ollama",
  "retry_after": 5
}
```

---

### Rate Limiting

The local API enforces a rate limit of **100 requests per minute** per token to prevent accidental denial-of-service from runaway scripts.

**Rate Limit Headers:**

Every response includes rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 97
X-RateLimit-Reset: 1720177200
```

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests allowed per window |
| `X-RateLimit-Remaining` | Requests remaining in current window |
| `X-RateLimit-Reset` | Unix timestamp when the window resets |

**Rate Limited Response (429):**

```json
{
  "type": "https://promptforge.ai/errors/rate-limited",
  "title": "Too Many Requests",
  "status": 429,
  "detail": "Rate limit exceeded. Maximum 100 requests per minute. Try again in 23 seconds.",
  "instance": "/api/v1/enhance",
  "retry_after": 23
}
```

**Response Headers:**

```
Retry-After: 23
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1720177223
```

---

### CORS Policy

The local API only accepts requests from localhost origins:

```
Access-Control-Allow-Origin: http://localhost:*
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, Accept
Access-Control-Max-Age: 86400
```

Requests from non-localhost origins will receive a CORS error.

---

## SDK & Integration Examples

### Node.js / TypeScript

```typescript
const PROMPTFORGE_URL = 'http://localhost:9876';
const PROMPTFORGE_TOKEN = process.env.PROMPTFORGE_TOKEN;

async function enhancePrompt(text: string, mode = 'enhance') {
  const response = await fetch(`${PROMPTFORGE_URL}/api/v1/enhance`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PROMPTFORGE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, mode }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`${error.title}: ${error.detail}`);
  }

  return response.json();
}

// Usage
const result = await enhancePrompt('write tests for my auth module');
console.log(result.enhanced_text);
```

### Python

```python
import requests

PROMPTFORGE_URL = "http://localhost:9876"
PROMPTFORGE_TOKEN = "pfg_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"

def enhance_prompt(text: str, mode: str = "enhance") -> dict:
    response = requests.post(
        f"{PROMPTFORGE_URL}/api/v1/enhance",
        headers={
            "Authorization": f"Bearer {PROMPTFORGE_TOKEN}",
            "Content-Type": "application/json",
        },
        json={"text": text, "mode": mode},
    )
    response.raise_for_status()
    return response.json()

# Usage
result = enhance_prompt("write tests for my auth module")
print(result["enhanced_text"])
```

### cURL

```bash
# Enhance a prompt
curl -X POST http://localhost:9876/api/v1/enhance \
  -H "Authorization: Bearer pfg_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" \
  -H "Content-Type: application/json" \
  -d '{"text": "write tests for my auth module", "mode": "enhance"}'

# Get history
curl "http://localhost:9876/api/v1/history?limit=5&sort_by=created_at&sort_order=desc" \
  -H "Authorization: Bearer pfg_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"

# Health check (no auth required)
curl http://localhost:9876/api/v1/health
```

---

## Versioning

The API is versioned via URL path (`/api/v1/`). Breaking changes will increment the version number. Non-breaking additions (new fields, new endpoints) may be added without version change.

| Version | Status | Notes |
|---------|--------|-------|
| `v1` | **Current** | Initial stable release |

---

<div align="center">

*For more details, see [ARCHITECTURE.md](./ARCHITECTURE.md) and [MCP.md](./MCP.md).*

</div>
