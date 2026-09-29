import { CodeFile, TestCase, TestSuite, TestRunSummary } from '../types/editor';

// Génère la suite de tests par défaut pour un fichier donné
export function getDefaultTestSuite(file: CodeFile): TestSuite {
  if (file.name.includes('checkout') || file.content.includes('CheckoutService')) {
    return {
      id: 'suite-checkout',
      fileName: file.name,
      suiteName: 'CheckoutService (Vitest / Jest)',
      status: 'idle',
      tests: [
        {
          id: 'test-1',
          title: 'devrait rejeter les codes promos invalides et retourner 0 EUR',
          status: 'idle',
        },
        {
          id: 'test-2',
          title: 'devrait calculer la somme des articles sans erreur d’indice (off-by-one)',
          status: 'idle',
        },
        {
          id: 'test-3',
          title: 'devrait lever une exception explicite si le panier est vide',
          status: 'idle',
        },
        {
          id: 'test-4',
          title: 'devrait calculer correctement la TVA à 20% sur le montant remisé',
          status: 'idle',
        },
        {
          id: 'test-5',
          title: 'devrait appliquer 20% de remise sur le coupon SUMMER20 avec validation asynchrone',
          status: 'idle',
        },
      ],
      testCode: `import { describe, it, expect, beforeEach } from 'vitest';
import { CheckoutService } from './checkoutService';

describe('CheckoutService', () => {
  let service: CheckoutService;

  beforeEach(() => {
    service = new CheckoutService();
  });

  it('devrait rejeter les codes promos invalides et retourner 0 EUR', async () => {
    const discount = await service.applyPromoCode('INVALID_CODE', 100);
    expect(discount).toBe(0);
  });

  it('devrait calculer la somme des articles sans erreur d’indice (off-by-one)', () => {
    const items = [
      { id: '1', name: 'Produit A', price: 50, quantity: 2 },
      { id: '2', name: 'Produit B', price: 30, quantity: 1 },
    ];
    const summary = service.calculateOrder(items, 0);
    expect(summary.subtotal).toBe(130);
  });

  it('devrait lever une exception explicite si le panier est vide', () => {
    expect(() => service.calculateOrder([], 0)).toThrow('Le panier est vide');
  });

  it('devrait calculer correctement la TVA à 20% sur le montant remisé', () => {
    const items = [{ id: '1', name: 'Produit A', price: 100, quantity: 1 }];
    const summary = service.calculateOrder(items, 20); // 80 HT
    expect(summary.tax).toBe(16);
    expect(summary.total).toBe(96);
  });

  it('devrait appliquer 20% de remise sur le coupon SUMMER20 avec validation asynchrone', async () => {
    const discount = await service.applyPromoCode('SUMMER20', 200);
    expect(discount).toBe(40);
  });
});`,
    };
  }

  if (file.name.includes('cache') || file.content.includes('CacheManager')) {
    return {
      id: 'suite-cache',
      fileName: file.name,
      suiteName: 'CacheManager Unit Tests',
      status: 'idle',
      tests: [
        {
          id: 'c-test-1',
          title: 'devrait stocker et restituer une valeur valide',
          status: 'idle',
        },
        {
          id: 'c-test-2',
          title: 'devrait retourner null sans crasher lors d’une clé inexistante',
          status: 'idle',
        },
        {
          id: 'c-test-3',
          title: 'devrait émettre un événement "set" lors de l’écriture',
          status: 'idle',
        },
      ],
      testCode: `import { describe, it, expect } from 'vitest';
import { CacheManager } from './cacheManager';

describe('CacheManager', () => {
  it('devrait stocker et restituer une valeur valide', () => {
    const cache = new CacheManager(5);
    cache.set('user', { id: 1 });
    expect(cache.get('user')).toEqual({ id: 1 });
  });

  it('devrait retourner null sans crasher lors d’une clé inexistante', () => {
    const cache = new CacheManager(5);
    expect(cache.get('cle_inexistante')).toBeNull();
  });

  it('devrait émettre un événement "set" lors de l’écriture', () => {
    const cache = new CacheManager(5);
    let captured = null;
    cache.on('set', (data) => { captured = data; });
    cache.set('foo', 'bar');
    expect(captured).toEqual({ key: 'foo', value: 'bar' });
  });
});`,
    };
  }

  // Suite générique pour tout autre fichier
  return {
    id: `suite-${file.id}`,
    fileName: file.name,
    suiteName: `${file.name} Test Suite`,
    status: 'idle',
    tests: [
      {
        id: 'g-test-1',
        title: 'devrait compiler et s’exécuter sans erreur de syntaxe',
        status: 'idle',
      },
      {
        id: 'g-test-2',
        title: 'devrait exporter les modules requis',
        status: 'idle',
      },
    ],
    testCode: `import { describe, it, expect } from 'vitest';

describe('${file.name}', () => {
  it('devrait compiler et s’exécuter sans erreur de syntaxe', () => {
    expect(true).toBe(true);
  });

  it('devrait exporter les modules requis', () => {
    expect('${file.name}').toBeDefined();
  });
});`,
  };
}

// Exécute la suite de tests en analysant le code courant du fichier
export async function runTestSuite(
  suite: TestSuite,
  code: string,
  onProgress?: (testId: string, status: TestCase['status'], duration: number, error?: string) => void
): Promise<{ suite: TestSuite; summary: TestRunSummary }> {
  const startTime = Date.now();
  const updatedTests: TestCase[] = [];

  for (const t of suite.tests) {
    const testStart = performance.now();
    let status: TestCase['status'] = 'passed';
    let errorMessage: string | undefined = undefined;
    let expected: string | undefined = undefined;
    let actual: string | undefined = undefined;

    // Simulation de l'évaluation réelle selon le contenu du code
    await new Promise((resolve) => setTimeout(resolve, 80 + Math.random() * 60));

    if (suite.id === 'suite-checkout') {
      // Test 1: promo code invalide
      if (t.id === 'test-1') {
        const hasAsyncAwait = code.includes('await this.verifyCouponWithDatabase') ||
          (code.includes('applyPromoCode') && code.includes('await'));
        const hasUnawaitedPromise = code.includes('const isValid = this.verifyCouponWithDatabase') &&
          !code.includes('await this.verifyCouponWithDatabase');

        if (hasUnawaitedPromise) {
          status = 'failed';
          errorMessage = 'AssertionError: expected 10 to equal 0';
          expected = '0 (aucun rabais sur code invalide)';
          actual = '10 (code non awaité = Promise truthy)';
        } else if (!hasAsyncAwait && code.includes('verifyCouponWithDatabase')) {
          status = 'failed';
          errorMessage = 'AssertionError: expected Promise to resolve to 0';
        }
      }

      // Test 2: calcul somme et off-by-one
      if (t.id === 'test-2') {
        const hasOffByOne = code.includes('i <= items.length') || code.includes('items[i].price');
        const hasSafeLoopOrReduce = code.includes('i < items.length') || code.includes('items.reduce') || code.includes('for (const item of items)');

        if (hasOffByOne && !hasSafeLoopOrReduce) {
          status = 'failed';
          errorMessage = 'TypeError: Cannot read properties of undefined (reading \'price\')';
          expected = '130 (Somme des articles)';
          actual = 'CRASH at line: items[i].price with i = items.length';
        }
      }

      // Test 3: exception panier vide
      if (t.id === 'test-3') {
        if (!code.includes('items.length === 0') || !code.includes('throw new Error')) {
          status = 'failed';
          errorMessage = 'AssertionError: expected calculateOrder([]) to throw an Error';
        }
      }

      // Test 4: calcul TVA
      if (t.id === 'test-4') {
        const hasOffByOne = code.includes('i <= items.length') && !code.includes('i < items.length') && !code.includes('items.reduce');
        if (hasOffByOne) {
          status = 'failed';
          errorMessage = 'TypeError: Cannot read properties of undefined (reading \'price\')';
        }
      }

      // Test 5: promo SUMMER20
      if (t.id === 'test-5') {
        const hasAsyncAwait = code.includes('await this.verifyCouponWithDatabase') ||
          code.includes('applyPromoCode') && code.includes('await');
        if (!hasAsyncAwait && code.includes('verifyCouponWithDatabase')) {
          status = 'failed';
          errorMessage = 'AssertionError: expected Promise to resolve to 40';
        }
      }
    } else if (suite.id === 'suite-cache') {
      // Tests pour CacheManager
      if (t.id === 'c-test-2') {
        const hasDirectAccessBug = code.includes('Date.now() > item.expiresAt') &&
          !code.includes('if (!item)') && !code.includes('if (item &&') && !code.includes('item?.expiresAt');
        if (hasDirectAccessBug) {
          status = 'failed';
          errorMessage = 'TypeError: Cannot read properties of undefined (reading \'expiresAt\')';
          expected = 'null';
          actual = 'CRASH at get("cle_inexistante")';
        }
      }
    }

    const duration = Math.round(performance.now() - testStart);

    const updatedTest: TestCase = {
      ...t,
      status,
      durationMs: duration,
      errorMessage,
      expected,
      actual,
    };

    updatedTests.push(updatedTest);
    if (onProgress) {
      onProgress(t.id, status, duration, errorMessage);
    }
  }

  const durationMs = Date.now() - startTime;
  const passed = updatedTests.filter((t) => t.status === 'passed').length;
  const failed = updatedTests.filter((t) => t.status === 'failed').length;
  const skipped = updatedTests.filter((t) => t.status === 'skipped').length;

  const suiteStatus: TestCase['status'] = failed > 0 ? 'failed' : 'passed';

  const updatedSuite: TestSuite = {
    ...suite,
    tests: updatedTests,
    status: suiteStatus,
    durationMs,
  };

  const summary: TestRunSummary = {
    total: updatedTests.length,
    passed,
    failed,
    skipped,
    durationMs,
  };

  return { suite: updatedSuite, summary };
}
