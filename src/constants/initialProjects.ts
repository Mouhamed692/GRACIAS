import { CodeFile } from '../types/editor';

export const INITIAL_FILES: CodeFile[] = [
  {
    id: 'checkout-service',
    name: 'checkoutService.ts',
    language: 'typescript',
    content: `// Service de traitement des commandes et paiements (E-Commerce)
// ✅ Version corrigée et refactorisée avec GRACIAS AI Studio

export interface CartItem {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly quantity: number;
}

export interface OrderSummary {
  readonly subtotal: number;
  readonly discount: number;
  readonly tax: number;
  readonly total: number;
  readonly currency: string;
}

export class CheckoutService {
  private readonly taxRate = 0.20; // 20% TVA

  // ✅ FIX BUG 1: Résolution asynchrone avec 'await' sur la vérification de coupon
  async applyPromoCode(code: string, subtotal: number): Promise<number> {
    const trimmedCode = code?.trim().toUpperCase();
    if (!trimmedCode || subtotal <= 0) return 0;
    
    // Requête API simulée avec 'await' impératif
    const isValid = await this.verifyCouponWithDatabase(trimmedCode); 
    if (isValid) {
      if (trimmedCode === "SUMMER20") {
        return Math.round((subtotal * 0.20 + Number.EPSILON) * 100) / 100;
      }
      return Math.round((subtotal * 0.10 + Number.EPSILON) * 100) / 100;
    }
    return 0;
  }

  private async verifyCouponWithDatabase(code: string): Promise<boolean> {
    // Simulation réseau asynchrone
    await new Promise((resolve) => setTimeout(resolve, 50));
    return code.startsWith("SUMMER") || code === "WELCOME10";
  }

  // ✅ FIX BUG 2 & 3: Remplacement de l'erreur d'indice par un reduce sécurisé et protection contre total négatif
  calculateOrder(items: CartItem[], discountAmount: number = 0): OrderSummary {
    if (!items || items.length === 0) {
      throw new Error("Le panier est vide");
    }

    // Calcul immuable et sans risque d'off-by-one
    const subtotal = items.reduce((acc, item) => {
      if (item.price < 0 || item.quantity <= 0) {
        throw new Error(\`Article de panier non valide: \${item.name}\`);
      }
      return acc + (item.price * item.quantity);
    }, 0);

    const safeDiscount = Math.min(Math.max(0, discountAmount), subtotal);
    const discountedSubtotal = subtotal - safeDiscount;
    const tax = discountedSubtotal * this.taxRate;
    const total = discountedSubtotal + tax;

    return {
      subtotal: Math.round((subtotal + Number.EPSILON) * 100) / 100,
      discount: Math.round((safeDiscount + Number.EPSILON) * 100) / 100,
      tax: Math.round((tax + Number.EPSILON) * 100) / 100,
      total: Math.round((total + Number.EPSILON) * 100) / 100,
      currency: "EUR"
    };
  }

  // Test d'exécution rapide
  async runCheckoutSimulation() {
    console.log("🛒 Démarrage de la simulation Checkout...");
    const cart: CartItem[] = [
      { id: "p1", name: "Écran 4K 144Hz", price: 349.99, quantity: 1 },
      { id: "p2", name: "Clavier Mécanique RGB", price: 129.50, quantity: 2 }
    ];

    const rawSubtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const discount = await this.applyPromoCode("SUMMER20", rawSubtotal);
    console.log("🎟️ Remise calculée (SUMMER20):", discount, "EUR");

    const summary = this.calculateOrder(cart, discount);
    console.log("✅ Résumé de commande validé:", JSON.stringify(summary, null, 2));
    return summary;
  }
}

// Exécuter la simulation
const service = new CheckoutService();
service.runCheckoutSimulation();
`,
  },
  {
    id: 'cache-manager',
    name: 'cacheManager.js',
    language: 'javascript',
    content: `// Gestionnaire de Cache LRU avec écouteurs d'événements
// ⚠️ Contient une fuite de mémoire et une référence non sécurisée

class CacheManager {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
    this.listeners = [];
  }

  set(key, value, ttlMs = 5000) {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    const expiresAt = Date.now() + ttlMs;
    this.cache.set(key, { value, expiresAt });
    this.emit('set', { key, value });
  }

  get(key) {
    const item = this.cache.get(key);
    // BUG: Accès direct à item.expiresAt sans vérifier si 'item' existe
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  on(event, callback) {
    // Fuite mémoire: les callbacks ne sont jamais nettoyés
    this.listeners.push({ event, callback });
  }

  emit(event, data) {
    for (const listener of this.listeners) {
      if (listener.event === event) {
        listener.callback(data);
      }
    }
  }
}

// Test d'exécution
const cache = new CacheManager(5);
cache.set('user_101', { name: 'Alice Dupont', role: 'Architecte' });
console.log('Utilisateur en cache:', cache.get('user_101'));
console.log('Tentative sur clé inexistante:', cache.get('inconnue'));
`,
  },
  {
    id: 'algorithms-py',
    name: 'algorithms.py',
    language: 'python',
    content: `# Algorithmes de recherche et tri en Python
# ⚠️ Contient un bug de recherche binaire et une condition limite

def binary_search(arr, target):
    """
    Recherche dichotomique d'un élément dans une liste triée.
    Retourne l'index de la cible ou -1 si non trouvée.
    """
    left = 0
    right = len(arr) # BUG: Devrait être len(arr) - 1 pour éviter IndexError

    while left <= right:
        mid = (left + right) // 2
        
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
            
    return -1

def calculate_fibonacci(n):
    # Suite de Fibonacci avec mémoïsation
    if n <= 0:
        return 0
    if n == 1:
        return 1
    return calculate_fibonacci(n - 1) + calculate_fibonacci(n - 2)

# Tests de démonstration
numbers = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
print("Tableau trié:", numbers)
index = binary_search(numbers, 23)
print(f"Index trouvé pour 23: {index}")
`,
  },
  {
    id: 'config-json',
    name: 'appConfig.json',
    language: 'json',
    content: `{
  "appName": "GRACIAS AI Studio Workspace",
  "version": "2.4.0",
  "aiEngine": {
    "model": "gemini-3.8-flash",
    "inlineCompletionDelayMs": 300,
    "realTimeDiagnostics": true,
    "maxTokens": 4096
  },
  "runtime": {
    "timeoutMs": 5000,
    "safeEval": true,
    "interceptConsole": true
  }
}`,
  },
];
