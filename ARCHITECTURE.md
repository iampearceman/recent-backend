# Cross-Cutting Concerns Implementation

This document describes the foundational "bones" that have been established for the backend.

## 🔧 Configuration System

**Location**: `src/config/config.ts`

### Features:
- **Type-safe environment bindings** - Validates Cloudflare Workers env bindings with Zod
- **Typed AppConfig object** - Structured configuration derived from environment
- **Environment detection** - Helpers for `isDevelopment`, `isProduction`

### Usage:
```typescript
import { createConfig } from './config/config'

const config = createConfig(c.env)
console.log(config.environment)        // 'development' | 'staging' | 'production'
console.log(config.openai.apiKey)      // string | undefined
console.log(config.database.url)       // string | undefined
```

### Extending:
Add new environment variables in `EnvSchema` and corresponding fields in `AppConfig`.

---

## ❌ Error Handling System

### Error Schema
**Location**: `src/app/schemas/error-schema.ts`

Standard API error response format:
```typescript
{
  status: "error",
  code: "NOT_FOUND",
  message: "User not found",
  details?: any,
  requestId?: string,
  timestamp: "2025-12-04T10:30:00Z"
}
```

### Domain Errors
**Location**: `src/core/shared/errors.ts`

Base class and common error types:
- `DomainError` - Base class for all domain errors
- `NotFoundError` (404) - Resource not found
- `ValidationError` (400) - Input validation failed
- `UnauthorizedError` (401) - Authentication required
- `ForbiddenError` (403) - Access denied
- `ConflictError` (409) - Resource conflict
- `BadRequestError` (400) - Malformed request
- `InternalError` (500) - Server error

### Usage:
```typescript
import { NotFoundError, ValidationError } from './core/shared/errors'

// Throw errors anywhere - they'll be caught by the global handler
throw new NotFoundError('User not found')

throw new ValidationError('Invalid email', {
  field: 'email',
  reason: 'invalid_format'
})
```

### Global Error Handler
**Location**: `src/index.ts`

Automatically catches and formats all errors:
- Domain errors → appropriate status codes with error schema
- Zod validation errors → 400 with validation details
- Unknown errors → 500 with safe error message
- Development mode → includes stack traces

---

## 📁 File Structure

```
src/
├── config/
│   └── config.ts              # Environment config & bindings
├── core/
│   └── shared/
│       └── errors.ts          # Domain error classes
├── app/
│   └── schemas/
│       └── error-schema.ts    # API error response schema
├── examples.ts                # Usage examples
└── index.ts                   # Main app with error handler
```

---

## ✅ Best Practices

1. **Always use domain errors** - Never throw generic `Error` objects
2. **Include helpful details** - Add context in the `details` field
3. **Type your env bindings** - Add to `EnvSchema` and `AppConfig`
4. **Let errors bubble** - Global handler catches everything
5. **Use config helpers** - `config.isDevelopment` for environment checks

---

## 🧪 Testing the Setup

Start the dev server:
```bash
pnpm dev
```

Test endpoints:
```bash
# Health check
curl http://localhost:8787/health

# Test error handling (if using examples)
curl http://localhost:8787/user/999
curl -X POST http://localhost:8787/validate-example -d '{"email":"invalid"}'
curl http://localhost:8787/protected
```

---

## 🚀 Next Steps

With these foundations in place, you can now:
- Add database layer (Drizzle ORM ready)
- Implement business logic with consistent error handling
- Add authentication middleware
- Create API routes with type-safe config access
- Build domain services that throw appropriate errors
