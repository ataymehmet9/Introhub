# CRM Integration Tests

This directory contains tests for the HubSpot CRM integration feature.

## Test Structure

### Unit Tests

- **field-mapping.test.ts** ✅ (15 tests passing)
  - Tests field mapping logic between HubSpot and our database
  - Validates contact transformation and validation
  - Tests batch processing and statistics

### Integration Tests

- **trpc-endpoints.test.ts** 🚧 (Marked as .todo - requires database setup)
  - Tests tRPC API endpoints
  - Validates business logic and error handling
  - Tests analytics calculations

## Running Tests

```bash
# Run all CRM tests
pnpm test src/__tests__/crm

# Run specific test file
pnpm test src/__tests__/crm/field-mapping.test.ts

# Run with coverage
pnpm test:coverage src/__tests__/crm
```

## Implementing Integration Tests

The integration tests in `trpc-endpoints.test.ts` are currently marked as `.todo` because they require:

### 1. Test Database Setup

Create a test database configuration:

```typescript
// src/__tests__/setup/database.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

export async function setupTestDatabase() {
  const client = postgres(process.env.TEST_DATABASE_URL!)
  const db = drizzle(client)

  // Run migrations
  // Seed test data

  return { db, client }
}

export async function teardownTestDatabase(client: any) {
  await client.end()
}
```

### 2. tRPC Test Context

Create a test context for tRPC calls:

```typescript
// src/__tests__/setup/trpc-context.ts
import { createServerCaller } from '@/integrations/trpc/server-context'

export async function createTestContext(userId: string) {
  // Mock auth session
  const mockSession = {
    user: { id: userId },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }

  return createServerCaller(mockSession)
}
```

### 3. Test Data Factories

Create factories for test data:

```typescript
// src/__tests__/factories/crm.factory.ts
export function createTestIntegration(overrides = {}) {
  return {
    userId: 'test-user-1',
    provider: 'hubspot',
    accessToken: 'encrypted-token',
    refreshToken: 'encrypted-refresh',
    status: 'active',
    syncFrequency: '24h',
    ...overrides,
  }
}

export function createTestSyncLog(overrides = {}) {
  return {
    userId: 'test-user-1',
    integrationId: 1,
    provider: 'hubspot',
    status: 'completed',
    totalContacts: 100,
    successCount: 95,
    errorCount: 5,
    ...overrides,
  }
}
```

### 4. Example Integration Test

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setupTestDatabase, teardownTestDatabase } from '../setup/database'
import { createTestContext } from '../setup/trpc-context'
import {
  createTestIntegration,
  createTestSyncLog,
} from '../factories/crm.factory'

describe('getSyncAnalytics', () => {
  let db: any
  let client: any
  let caller: any

  beforeEach(async () => {
    ;({ db, client } = await setupTestDatabase())
    caller = await createTestContext('test-user-1')

    // Insert test data
    await db.insert(crmIntegrations).values(createTestIntegration())
    await db
      .insert(syncLogs)
      .values([
        createTestSyncLog({ status: 'completed', successCount: 100 }),
        createTestSyncLog({ status: 'failed', errorCount: 50 }),
      ])
  })

  afterEach(async () => {
    await teardownTestDatabase(client)
  })

  it('should calculate success rate correctly', async () => {
    const result = await caller.crm.getSyncAnalytics({
      provider: 'hubspot',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    })

    expect(result.successRate).toBe(50.0) // 1 success, 1 failure = 50%
    expect(result.totalSyncs).toBe(2)
  })
})
```

## Test Coverage Goals

- **Unit Tests**: ✅ 100% coverage for field mapping logic
- **Integration Tests**: 🎯 80% coverage for tRPC endpoints
- **E2E Tests**: 🎯 Critical user flows (OAuth, sync, analytics)

## Mocking External Services

For tests that interact with HubSpot API:

```typescript
import { vi } from 'vitest'

vi.mock('@/services/hubspot.service', () => ({
  HubSpotService: vi.fn().mockImplementation(() => ({
    fetchContacts: vi
      .fn()
      .mockResolvedValue([
        { id: '1', properties: { email: 'test@example.com' } },
      ]),
    refreshAccessToken: vi.fn().mockResolvedValue({
      access_token: 'new-token',
      expires_in: 3600,
    }),
  })),
}))
```

## Continuous Integration

Tests run automatically on:

- Pre-commit (via Husky)
- Pull requests
- Main branch pushes

## Contributing

When adding new CRM features:

1. Write unit tests first (TDD approach)
2. Add integration test placeholders
3. Update this README with new test requirements
4. Ensure all tests pass before committing

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [tRPC Testing Guide](https://trpc.io/docs/server/testing)
- [Drizzle ORM Testing](https://orm.drizzle.team/docs/testing)
