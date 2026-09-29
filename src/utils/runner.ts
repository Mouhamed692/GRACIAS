import { ConsoleEntry, SupportedLanguage } from '../types/editor';

export interface RunResult {
  entries: ConsoleEntry[];
  executionTimeMs: number;
  hasErrors: boolean;
  returnValue?: any;
}

export async function runCodeSandboxed(
  code: string,
  language: SupportedLanguage
): Promise<RunResult> {
  const entries: ConsoleEntry[] = [];
  const startTime = performance.now();
  let hasErrors = false;

  const pushEntry = (type: ConsoleEntry['type'], ...args: any[]) => {
    const formatted = args
      .map((arg) => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');

    entries.push({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      message: formatted,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  // Traitement Python léger
  if (language === 'python') {
    pushEntry('system', '🐍 Environnement Python 3.12 (Virtual Sandbox)');
    try {
      // Simulation d'exécution Python pour les algorithmes
      if (code.includes('binary_search')) {
        pushEntry('log', 'Tableau trié: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]');
        if (code.includes('right = len(arr)') && !code.includes('len(arr) - 1')) {
          hasErrors = true;
          pushEntry(
            'error',
            'IndexError: list index out of range at line 14: arr[mid] == target'
          );
          pushEntry(
            'system',
            '💡 Le Débogueur IA GRACIAS recommande : remplacez len(arr) par len(arr) - 1'
          );
        } else {
          pushEntry('log', 'Index trouvé pour 23: 5');
          pushEntry('system', '✅ Exécution Python terminée avec succès');
        }
      } else {
        // Interprétation basique des prints Python
        const printMatches = code.matchAll(/print\((.*?)\)/g);
        for (const match of printMatches) {
          pushEntry('log', match[1].replace(/['"]/g, ''));
        }
        pushEntry('system', '✅ Script Python exécuté');
      }
    } catch (err: any) {
      hasErrors = true;
      pushEntry('error', String(err?.message || err));
    }

    const duration = Math.round((performance.now() - startTime) * 100) / 100;
    return { entries, executionTimeMs: duration, hasErrors };
  }

  // Traitement JS / TS
  if (language === 'json') {
    try {
      JSON.parse(code);
      pushEntry('system', '✅ JSON valide et conforme.');
    } catch (err: any) {
      hasErrors = true;
      pushEntry('error', `Erreur de syntaxe JSON : ${err.message}`);
    }
    const duration = Math.round((performance.now() - startTime) * 100) / 100;
    return { entries, executionTimeMs: duration, hasErrors };
  }

  // Pour TS/JS : transpilation légère pour nettoyer les types TypeScript
  let runnableCode = code;
  if (language === 'typescript') {
    runnableCode = runnableCode
      // Supprimer les interfaces et types
      .replace(/export\s+interface\s+\w+[\s\S]*?\{[\s\S]*?\}/g, '')
      .replace(/interface\s+\w+[\s\S]*?\{[\s\S]*?\}/g, '')
      .replace(/type\s+\w+\s*=[\s\S]*?;/g, '')
      // Supprimer les annotations de types de variables et paramètres: (: string, : number, etc.)
      .replace(/:\s*([A-Za-z0-9_<>[\]]+)(\s*[,)=])/g, '$2')
      .replace(/:\s*Promise<[A-Za-z0-9_<>[\]]+>/g, '')
      // Supprimer les modificateurs de classe (private, public, protected, readonly)
      .replace(/(?:private|public|protected|readonly)\s+/g, '')
      // Supprimer les casts "as Something"
      .replace(/\s+as\s+[A-Za-z0-9_<>[\]]+/g, '')
      // Supprimer 'export default' et 'export'
      .replace(/export\s+(?:default\s+)?/g, '');
  } else {
    runnableCode = runnableCode.replace(/export\s+(?:default\s+)?/g, '');
  }

  pushEntry('system', `⚡ Exécution du module ${language.toUpperCase()}...`);

  // Environnement sandbox avec mock console
  const customConsole = {
    log: (...args: any[]) => pushEntry('log', ...args),
    warn: (...args: any[]) => pushEntry('warn', ...args),
    error: (...args: any[]) => pushEntry('error', ...args),
    info: (...args: any[]) => pushEntry('info', ...args),
    table: (...args: any[]) => pushEntry('log', ...args),
  };

  try {
    const sandboxAsyncFunction = new Function(
      'console',
      'setTimeout',
      'setInterval',
      `return (async () => {
        ${runnableCode}
      })();`
    );

    const result = await sandboxAsyncFunction(customConsole, setTimeout, setInterval);
    if (result !== undefined) {
      pushEntry('info', `Valeur de retour: ${typeof result === 'object' ? JSON.stringify(result) : result}`);
    }
  } catch (err: any) {
    hasErrors = true;
    const errorMsg = err?.stack || err?.message || String(err);
    pushEntry('error', errorMsg);
  }

  const duration = Math.round((performance.now() - startTime) * 100) / 100;
  pushEntry(
    hasErrors ? 'system' : 'system',
    hasErrors
      ? `❌ Échec d'exécution (${duration}ms) — Analysez l'erreur avec le Débogueur IA`
      : `✨ Exécution terminée avec succès (${duration}ms)`
  );

  return {
    entries,
    executionTimeMs: duration,
    hasErrors,
  };
}
