# Development Guide

## Project Architecture

```
identify-service/
├── src/
│   ├── controllers/       # Business logic handlers
│   │   └── identifyController.ts
│   ├── routes/           # Express route handlers
│   │   └── identifyroutes.ts
│   ├── utils/            # Utility functions
│   │   └── validation.ts
│   ├── db.ts            # Database connection pool
│   ├── types.ts         # TypeScript interfaces
│   ├── repository.ts    # Data access layer
│   └── index.ts         # Express app entry point
├── migrations/          # Database schema
│   └── 001_create_contacts_table.sql
├── scripts/             # Build and utility scripts
├── test-identify.ps1    # Test suite
├── package.json         # Dependencies
└── tsconfig.json       # TypeScript config
```

## Architecture Patterns

### 1. Repository Pattern
All database operations go through `src/repository.ts`:
```typescript
// Bad - direct pool queries in controller
app.get("/contact", async (req, res) => {
  const result = await pool.query("SELECT * FROM contacts WHERE id = $1", [id]);
});

// Good - via repository layer
const contact = await findContactById(id);
```

### 2. Separation of Concerns
- **Controllers** (`src/controllers/`) - Handle HTTP logic and coordinate operations
- **Repository** (`src/repository.ts`) - Manage all database access
- **Routes** (`src/routes/`) - Define HTTP endpoints and map to controllers
- **Utils** (`src/utils/`) - Reusable functions (validation, formatting, etc.)
- **Types** (`src/types.ts`) - Shared TypeScript interfaces

### 3. Error Handling
- Use try/catch in controllers
- Validate input in dedicated utility functions
- Return consistent error responses
- Log errors in middleware for debugging

## Development Workflow

### 1. Making Code Changes

**Add a new feature:**
```bash
# Create a feature branch
git checkout -b feature/my-feature

# Make changes
# Run tests
npm run build

# Commit with conventional message
git add .
git commit -m "feat: describe your feature

- Detail 1
- Detail 2"

# Push and create PR
git push -u origin feature/my-feature
```

### 2. Adding Validation

Add to `src/utils/validation.ts`:
```typescript
export const validateMyInput = (input: string): {valid: boolean; error?: string} => {
  if (!input) {
    return { valid: false, error: "Input required" };
  }
  return { valid: true };
};
```

Use in controller:
```typescript
const validation = validateMyInput(data);
if (!validation.valid) {
  res.status(400).json({ error: validation.error });
  return;
}
```

### 3. Adding Database Operations

Add to `src/repository.ts`:
```typescript
export async function findContactsByCity(city: string): Promise<Contact[]> {
  const result = await pool.query(
    "SELECT * FROM contacts WHERE city = $1",
    [city]
  );
  return result.rows.map(rowToContact);
}
```

Use in controller:
```typescript
const contacts = await findContactsByCity(city);
```

### 4. Adding New Endpoints

Create route in `src/routes/newroutes.ts`:
```typescript
import { Router, Request, Response } from "express";
import { myController } from "../controllers/myController";

const router = Router();
router.post("/", myController);

export default router;
```

Mount in `src/index.ts`:
```typescript
app.use("/myendpoint", myRoutes);
```

## Testing

Run comprehensive test suite:
```bash
.\test-identify.ps1
```

The test suite covers:
- New contact creation
- Contact linking with new information
- Contact consolidation and merging
- Null field handling
- Multiple primary contact resolution

### Manual Testing with cURL

```bash
# Create new contact
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","phoneNumber":"1234567890"}'

# Check health
curl http://localhost:3000/health

# Test validation
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email"}'
```

## Database Development

### Running Migrations
```bash
psql "postgresql://identify_user:8978@localhost:5432/identify_db" \
  -f migrations/001_create_contacts_table.sql
```

### Viewing Data
```bash
psql -U identify_user -d identify_db

# List all contacts
SELECT * FROM contacts ORDER BY id;

# Find linked contacts
SELECT id, email, phone_number, linked_id, link_precedence 
FROM contacts WHERE linked_id = 1 OR id = 1;

# Count contacts
SELECT COUNT(*) FROM contacts;

# Clear data (for testing)
TRUNCATE TABLE contacts RESTART IDENTITY CASCADE;
```

## Build Commands

```bash
# Development (with hot reload)
npm run dev

# Build TypeScript
npm run build

# Start from compiled JavaScript
npm start

# Check TypeScript compilation
npx tsc --noEmit
```

## Code Style Guidelines

### 1. Naming Conventions
- **Functions**: camelCase, verbs preferred (`findContact`, `createContact`)
- **Constants**: UPPER_SNAKE_CASE
- **Classes**: PascalCase
- **Interfaces**: PascalCase, prefixed with `I` (e.g., `IContact`)
- **Types**: PascalCase

### 2. Function Documentation
```typescript
/**
 * Finds all contacts matching email or phone number
 * @param email - Email to search for (can be null)
 * @param phoneNumber - Phone number to search for (can be null)
 * @returns Array of matching contacts sorted by created_at
 */
export async function findContactsByEmailOrPhone(
  email: string | null,
  phoneNumber: string | null
): Promise<Contact[]> {
  // implementation
}
```

### 3. Error Handling
```typescript
try {
  // operation
} catch (error) {
  console.error("Failed to find contacts:", error);
  throw new Error("Database query failed");
}
```

### 4. Async/Await
Always use async/await for promises:
```typescript
// Good
const result = await pool.query(sql, params);

// Avoid
pool.query(sql, params).then(result => { });
```

## Performance Considerations

1. **Parameterized Queries** - Always use `$1, $2` syntax to prevent SQL injection:
   ```typescript
   pool.query("SELECT * FROM contacts WHERE id = $1", [id]);
   ```

2. **Index on Frequently Searched Columns** - Email and phone_number searches are optimized:
   ```sql
   CREATE INDEX idx_contacts_email ON contacts(email);
   CREATE INDEX idx_contacts_phone ON contacts(phone_number);
   ```

3. **Connection Pooling** - Pool is configured with reasonable defaults in `src/db.ts`

4. **Query Optimization** - Use `linked_id` index for joining related contacts

## Debugging Tips

### 1. Enable Debug Logging
```typescript
import { debuglog } from "util";
const debug = debuglog("identify:controller");

debug("Input validation passed for email:", email);
```

### 2. Database Query Inspection
```typescript
const query = `SELECT * FROM contacts WHERE email = $1 OR phone_number = $2`;
console.log("Executing query:", query);
console.log("With params:", [email, phoneNumber]);
const result = await pool.query(query, [email, phoneNumber]);
```

### 3. Stack Traces
Enable source maps (already enabled in tsconfig.json):
```typescript
console.error("Error details:", error.stack);
```

## Common Tasks

### Add a new validation rule
1. Add to `src/utils/validation.ts`
2. Export function with clear documentation
3. Use in controller with proper error response
4. Test with test suite

### Add a database field
1. Create new migration file: `migrations/002_add_field.sql`
2. Update `Contact` interface in `src/types.ts`
3. Update `rowToContact` function in `src/repository.ts`
4. Update relevant queries if needed

### Add a new endpoint
1. Create handler in controller file
2. Create route file or add to existing
3. Mount in `src/index.ts`
4. Add validation in utils
5. Test with manual requests
6. Add to test suite

## Troubleshooting

**Port already in use:**
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F
```

**Database connection error:**
```bash
# Test connection string
psql "postgresql://identify_user:8978@localhost:5432/identify_db"

# Check database exists
psql -U identify_user -l
```

**TypeScript compilation errors:**
```bash
# Check strict mode issues
npx tsc --noEmit
```

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL node-postgres](https://node-postgres.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Conventional Commits](https://www.conventionalcommits.org/)
