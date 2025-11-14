# Contributing to Identify Service

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/sainathg1002/Identity-Reconciliation-.git
cd identify-service
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Run migrations:
```bash
psql "postgresql://identify_user:8978@localhost:5432/identify_db" -f migrations/001_create_contacts_table.sql
```

5. Start development server:
```bash
npm run dev
```

## Commit Messages

We follow conventional commit format:
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code refactoring without feature changes
- `docs:` Documentation changes
- `test:` Test additions or updates
- `chore:` Build, dependencies, tooling

Example:
```
feat: add contact validation middleware
fix: resolve race condition in consolidation logic
docs: update API documentation with examples
```

## Code Style

- Use TypeScript for type safety
- Run `npm run build` to verify compilation
- Follow async/await patterns for promises
- Use named exports for functions

## Testing

Run the test suite:
```bash
.\test-identify.ps1
```

## Pull Requests

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Commit with clear messages
3. Push to your fork
4. Submit PR with description of changes

## Reporting Issues

Use GitHub Issues to report:
- Bugs (with reproduction steps)
- Feature requests (with use case)
- Documentation improvements

Include:
- Environment details (Node.js version, OS)
- Error messages and logs
- Steps to reproduce
