# Standardized Next.js Architecture & Migration Guide

This document outlines the architectural patterns and strict API contracts implemented to stabilize this application. It serves as a guide for developers migrating existing "vibe-coded" features to the new robust standard.

## 1. Unified API Contract

Every backend endpoint **MUST** return data in the following format (defined in `app/lib/types/api.ts`):

### Success Response
```json
{
  "success": true,
  "data": { ...any },
  "message": "Optional localized success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "General error message (e.g., 'Validation Error')",
  "details": [ ...optional array or object of specifics ]
}
```

**Developer Action:** 
Stop using `NextResponse.json()` directly in routes. Always use:
- `return ResponseUtil.success(data, message, status)`
- `return ResponseUtil.error(error, defaultMessage, status)`
- `return ResponseUtil.unauthorized()`

## 2. Backend Layer Separation

We have adopted an N-tier architecture within the `app/api` directory to prevent "Fat Controllers" (monolithic route files).

### The Layers
1. **Routes (`app/api/.../route.ts`)**: Responsible ONLY for HTTP parsing, Session checking, DTO validation, and returning the `ResponseUtil` formatted standard response.
2. **DTOs / Validations (`app/lib/validations/...`)**: We use **Zod** for all input validation. Extract schemas into this folder. Use `Schema.parse(body)`.
3. **Services (`app/lib/services/...`)**: Contains ALL business logic, database queries (`mongoose`), and throws standardized `AppError` objects.
4. **Models (`app/models/...`)**: Pure Mongoose schemas.

### Throwing Errors in Services
Inside a service, throw semantic errors instead of returning status objects:
```typescript
import { NotFoundError, ForbiddenError, UnauthorizedError, ValidationError } from "../errors";

if (!post) throw new NotFoundError("Post not found");
if (post.authorId !== userId) throw new ForbiddenError("You cannot edit this post");
```

## 3. Frontend Data Fetching

We have abstracted `fetch`/`axios` out of React Components to guarantee predictable error handling and type safety.

### The Central API Client
The `api` export from `app/lib/api.ts` is an `axios` instance configured to automatically unpack `error.response.data`.
When a 4xx/5xx error occurs:
- The promise rejects with a standard Javascript `Error`
- The `error.message` strictly matches the backend's `"error"` field.
- `error.details` contains the backend's `"details"` field (e.g. Zod validation specifics).

### Custom Hooks
Do not use `api.get()` directly inside React `useEffect`. Create a custom hook for each domain (e.g., `app/hooks/usePosts.ts`).
Custom hooks should manage:
- `data`
- `isLoading`
- `error` (a simplified string or object mapping to UI states)

## 4. Migration Strategy for Existing Code

If you are migrating an existing route:
1. **Analyze**: Identify the inputs, outputs, and business logic of the existing route.
2. **Create Schema**: Write a Zod schema in `validations/` for the request body/query.
3. **Extract Logic**: Move database calls and logic into a `services/[domain].service.ts` class method.
4. **Refactor Route**: Update the route to use the schema `.parse()`, call the service, and return via `ResponseUtil.success()`.
5. **Update Frontend**: Replace raw `axios/fetch` calls in components with a new generic custom hook that consumes the `api.ts` client.
