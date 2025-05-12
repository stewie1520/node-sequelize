# Zod Validation in my-first-electric

This guide explains how we use Zod for robust type-safe validation in our API.

## Introduction

[Zod](https://github.com/colinhacks/zod) is a TypeScript-first schema validation library that helps us ensure our application's data is valid at runtime. It provides:

- Strong type inference
- Comprehensive error messages
- Composable schemas
- Integration with TypeScript's type system

## Project Structure

Our validation implementation follows this structure:

- `src/schemas/` - Contains all Zod validation schemas
- `src/utils/validation.ts` - Utilities for handling validation errors

## Schema Definition

Schemas are defined in `src/schemas/userSchemas.ts` and are used to validate different aspects of our application:

```typescript
// Example schema:
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});
```

We export both the schemas and their inferred types:

```typescript
export type RegisterInput = z.infer<typeof registerSchema>;
```

## Middleware Usage

To validate requests, we use middleware in our routes:

```typescript
// Validate request body
router.post('/register', AuthController.register);

// Validate URL parameters
router.get('/:id', UserController.getUserById);

// Validate query parameters
router.get('/', UserController.getAllUsers);
```

The validation middleware:
1. Validates incoming data against the provided schema
2. Puts validated data in the request context for the controller to use
3. Returns standardized error responses for invalid data

## Controller Implementation

Controllers access validated data from the context:

```typescript
async register(c: Context) {
  try {
    const body = registerSchema.parse(await c.req.json())

    // Use the data with full type safety
    const user = await UserService.register(validatedData);

    // Return success response
    return c.json({ success: true, data: user });
  } catch (error) {
    return handleControllerError(c, error);
  }
}
```

## Error Handling

We use a consistent error handling pattern:

1. Validation errors are formatted with paths and messages
2. Custom application errors pass through with appropriate status codes
3. Unexpected errors return a generic 500 server error response


## Adding New Validation

To add validation for a new feature:

1. Define a schema in an appropriate schema file
2. Export the inferred type
3. Use the validated data in your controller

## Benefits

- **Type Safety**: Full TypeScript integration throughout the application
- **Better Error Messages**: Clear, structured error messages for clients
- **Reduced Boilerplate**: No manual validation code in controllers
- **Self-Documenting**: Schemas serve as documentation for data requirements
- **Runtime Safety**: Guarantees that data matches expected structure

## Best Practices

1. Keep validation logic separate from business logic
2. Create reusable sub-schemas for common fields
3. Use the `.refine()` method for custom validation rules
4. Let Zod infer types rather than defining them manually
5. Use appropriate coercion for query and URL parameters
