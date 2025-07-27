import { createLevelSystem, PlayerState, MonsterDefeat } from '../../src/systems/level-system';

/**
 * Simple test suite to demonstrate the level system is testable
 * This would normally use a proper testing framework like Jest
 */

// Mock configuration for testing
const testConfig = {
  levels: [
    {
      xpRequired: 0,
      unlockedSymbols: ['sword', 'shield'],
      title: 'Warrior',
      description: 'Test level 1'
    },
    {
      xpRequired: 100,
      unlockedSymbols: ['axe', 'bow'],
      title: 'Fighter',
      description: 'Test level 2'
    },
    {
      xpRequired: 250,
      unlockedSymbols: ['magic_staff'],
      title: 'Mage',
      description: 'Test level 3'
    }
  ],
  xpConfig: {
    baseXpPerSpin: 10,
    regularMonsterBonus: 20,
    bossMonsterBonus: 50,
    baseBet: 1
  },
  bossMonsters: ['DRAGON', 'LICH'],
  metadata: {
    version: '1.0.0-test'
  }
};

/**
 * Test runner function
 */
function runTests() {
  console.log('🧪 Running Level System Tests...\n');

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

  function assertEqual(actual: any, expected: any, message?: string) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}${message ? ` - ${message}` : ''}`);
    }
  }

  function assertTrue(condition: boolean, message?: string) {
    if (!condition) {
      throw new Error(`Expected true${message ? ` - ${message}` : ''}`);
    }
  }

  // Create test level system
  const levelSystem = createLevelSystem(testConfig);

  // Test 1: Initial player state
  test('Initial player state creation', () => {
    const player = levelSystem.createInitialPlayerState();
    assertEqual(player.level, 1);
    assertEqual(player.totalXp, 0);
    assertEqual(player.unlockedSymbols, ['sword', 'shield']);
  });

  // Test 2: XP calculation for spins
  test('XP calculation for regular monsters', () => {
    const monsters: MonsterDefeat[] = [
      { type: 'GOBLIN', wasBoss: false },
      { type: 'ORC', wasBoss: false }
    ];
    const xp = levelSystem.calculateSpinXp(1, monsters);
    assertEqual(xp, 50); // 10 base + 20 + 20 = 50
  });

  // Test 3: XP calculation for boss monsters
  test('XP calculation for boss monsters', () => {
    const monsters: MonsterDefeat[] = [
      { type: 'DRAGON', wasBoss: true }
    ];
    const xp = levelSystem.calculateSpinXp(1, monsters);
    assertEqual(xp, 60); // 10 base + 50 boss = 60
  });

  // Test 4: Bet scaling
  test('XP calculation with bet scaling', () => {
    const monsters: MonsterDefeat[] = [
      { type: 'GOBLIN', wasBoss: false }
    ];
    const xp = levelSystem.calculateSpinXp(2, monsters); // 2x bet
    assertEqual(xp, 60); // (10 base + 20) * 2 = 60
  });

  // Test 5: Level up progression
  test('Level up progression', () => {
    const player = levelSystem.createInitialPlayerState();
    
    // Add 100 XP to reach level 2
    const result = levelSystem.addXpToPlayer(player, 100);
    
    assertEqual(player.level, 2);
    assertEqual(player.totalXp, 100);
    assertEqual(player.unlockedSymbols, ['sword', 'shield', 'axe', 'bow']);
    assertTrue(result.levelUpResults.length === 1);
    assertEqual(result.levelUpResults[0].newLevel, 2);
    assertEqual(result.levelUpResults[0].newSymbols, ['axe', 'bow']);
  });

  // Test 6: Multiple level ups
  test('Multiple level ups in one XP gain', () => {
    const player = levelSystem.createInitialPlayerState();
    
    // Add 250 XP to reach level 3
    const result = levelSystem.addXpToPlayer(player, 250);
    
    assertEqual(player.level, 3);
    assertEqual(player.totalXp, 250);
    assertTrue(result.levelUpResults.length === 2);
    assertEqual(result.levelUpResults[1].newLevel, 3);
  });

  // Test 7: XP progress calculation
  test('XP progress calculation', () => {
    const player = levelSystem.createInitialPlayerState();
    player.totalXp = 50; // Halfway to level 2
    
    const progress = levelSystem.getXpProgress(player);
    assertEqual(progress.current, 50);
    assertEqual(progress.required, 100);
    assertEqual(progress.percentage, 50);
  });

  // Test 8: Boss monster detection
  test('Boss monster detection', () => {
    assertTrue(levelSystem.isBossMonster('DRAGON'));
    assertTrue(levelSystem.isBossMonster('LICH'));
    assertTrue(!levelSystem.isBossMonster('GOBLIN'));
  });

  // Test 9: Max level handling
  test('Max level handling', () => {
    const player = levelSystem.createInitialPlayerState();
    player.level = 3;
    player.totalXp = 1000; // More than enough XP
    
    const result = levelSystem.addXpToPlayer(player, 0);
    assertEqual(player.level, 3); // Should stay at max level
    assertTrue(result.levelUpResults.length === 0);
  });

  // Test 10: Symbol unlocking up to level
  test('Symbol unlocking up to level', () => {
    const symbols = levelSystem.getSymbolsUpToLevel(2);
    assertEqual(symbols, ['sword', 'shield', 'axe', 'bow']);
  });

  // Test 11: Player state validation
  test('Player state validation', () => {
    const validPlayer: PlayerState = {
      level: 2,
      totalXp: 100,
      unlockedSymbols: ['sword', 'shield']
    };
    assertTrue(levelSystem.validatePlayerState(validPlayer));

    const invalidPlayer: PlayerState = {
      level: 0, // Invalid level
      totalXp: 100,
      unlockedSymbols: ['sword']
    };
    assertTrue(!levelSystem.validatePlayerState(invalidPlayer));
  });

  // Test 12: Array-index based level configuration
  test('Array-index based level configuration', () => {
    const indexBasedConfig = {
      levels: [
        { xpRequired: 0, unlockedSymbols: ['sword'], title: 'Level 1', description: '' },    // Index 0 = Level 1
        { xpRequired: 100, unlockedSymbols: ['axe'], title: 'Level 2', description: '' }, // Index 1 = Level 2
        { xpRequired: 200, unlockedSymbols: ['hammer'], title: 'Level 3', description: '' } // Index 2 = Level 3
      ],
      xpConfig: testConfig.xpConfig,
      bossMonsters: [],
      metadata: {}
    };

    const system = createLevelSystem(indexBasedConfig);
    
    // Verify levels work correctly with array indices
    const level1 = system.getLevelConfig(1);
    const level2 = system.getLevelConfig(2);
    const level3 = system.getLevelConfig(3);
    
    // Verify correct data is returned for each level
    assertEqual(level1?.title, 'Level 1');
    assertEqual(level2?.title, 'Level 2');
    assertEqual(level3?.title, 'Level 3');
    assertEqual(level1?.unlockedSymbols, ['sword']);
    assertEqual(level2?.unlockedSymbols, ['axe']);
    assertEqual(level3?.unlockedSymbols, ['hammer']);
  });

  // Summary
  console.log(`\n🧪 Test Results: ${testsPassed}/${testsTotal} passed`);
  
  if (testsPassed === testsTotal) {
    console.log('🎉 All tests passed! Level system is working correctly.');
  } else {
    console.log(`❌ ${testsTotal - testsPassed} tests failed.`);
  }

  return testsPassed === testsTotal;
}

// Export for use in other files
export { runTests, testConfig };

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runTests();
} 