# Tests Directory

This directory contains all test files for the slot machine game project.

## Structure

```
tests/
├── README.md                     # This file
└── systems/
    └── level-system.test.ts      # Level system unit tests
```

## Running Tests

### Level System Tests

The level system tests can be run in several ways:

#### Option 1: NPM Scripts (Recommended)
```bash
# Run all tests
npm test

# Run specific level system tests
npm run test:level-system
```

#### Option 2: Direct Node.js Execution
```bash
# From project root
npx tsx tests/systems/level-system.test.ts
```

#### Option 3: Import and Run in Browser Console
```typescript
// In browser console
import { runTests } from '/tests/systems/level-system.test.ts';
runTests();
```

#### Option 4: Include in Development Build
Add to your main development file:
```typescript
import { runTests } from '../tests/systems/level-system.test.ts';

// Run tests in development mode
if (process.env.NODE_ENV === 'development') {
  runTests();
}
```

## Test Coverage

### Level System Tests (12 test cases)
- ✅ Initial player state creation
- ✅ XP calculation for regular monsters  
- ✅ XP calculation for boss monsters
- ✅ XP calculation with bet scaling
- ✅ Level up progression
- ✅ Multiple level ups in one XP gain
- ✅ XP progress calculation
- ✅ Boss monster detection
- ✅ Max level handling
- ✅ Symbol unlocking up to level
- ✅ Player state validation
- ✅ Configuration validation

## Adding New Tests

### Test File Naming Convention
- Use `.test.ts` extension
- Mirror the source directory structure
- Example: `src/systems/combat-system.ts` → `tests/systems/combat-system.test.ts`

### Test Structure Template
```typescript
import { ComponentToTest } from '../../src/path/to/component';

function runTests() {
  console.log('🧪 Running [Component] Tests...\n');
  
  let testsPassed = 0;
  let testsTotal = 0;

  function test(name: string, testFn: () => void) {
    testsTotal++;
    try {
      testFn();
      console.log(`✅ ${name}`);
      testsPassed++;
    } catch (error) {
      console.log(`❌ ${name}: ${error}`);
    }
  }

  function assertEqual(actual: any, expected: any) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  }

  function assertTrue(condition: boolean, message?: string) {
    if (!condition) {
      throw new Error(`Expected true${message ? ` - ${message}` : ''}`);
    }
  }

  // Your tests here...
  test('Test description', () => {
    // Test implementation
  });

  // Summary
  console.log(`\n🧪 Test Results: ${testsPassed}/${testsTotal} passed`);
  return testsPassed === testsTotal;
}

export { runTests };

if (typeof window === 'undefined') {
  runTests();
}
```

## Integration with Build Tools

### For Jest Integration (Future)
```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "testMatch": ["**/tests/**/*.test.ts"]
  }
}
```

### For Vitest Integration (Future)
```typescript
// vite.config.ts
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts']
  }
});
```

## Test Principles

1. **Pure Functions**: Test business logic without UI dependencies
2. **Mock Data**: Use custom configurations for isolated testing
3. **Edge Cases**: Test boundary conditions and error scenarios
4. **Deterministic**: Tests should have predictable, repeatable results
5. **Independent**: Each test should be able to run in isolation

## Contributing

When adding new features:
1. Write tests for new business logic
2. Ensure tests are UI-agnostic
3. Include both positive and negative test cases
4. Update this README if adding new test categories 