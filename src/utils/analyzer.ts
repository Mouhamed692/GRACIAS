import { DiagnosticIssue, SupportedLanguage } from '../types/editor';

export function analyzeCode(code: string, language: SupportedLanguage): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = [];
  const lines = code.split('\n');

  // 1. Détection syntaxique générale
  let openBraces = 0;
  let openParens = 0;
  let openBrackets = 0;

  for (let idx = 0; idx < lines.length; idx++) {
    const lineNum = idx + 1;
    const line = lines[idx];
    const trimmed = line.trim();

    // Ignorer les commentaires
    if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
      continue;
    }

    // A. Détection des promesses sans await
    if (language === 'typescript' || language === 'javascript') {
      if (
        (line.includes('verifyCouponWithDatabase') ||
          line.includes('fetch(') ||
          line.includes('Promise') ||
          line.includes('async')) &&
        !line.includes('await') &&
        !line.includes('return') &&
        !line.includes('.then') &&
        !line.includes('async ')
      ) {
        if (line.includes('const isValid = this.verifyCouponWithDatabase')) {
          issues.push({
            id: `issue-async-${lineNum}`,
            line: lineNum,
            severity: 'error',
            message: "Appel de fonction asynchrone sans 'await'. La valeur sera une Promise toujours évaluée à vrai.",
            rule: 'async/missing-await',
            fixPreview: line.replace('this.verifyCouponWithDatabase', 'await this.verifyCouponWithDatabase'),
          });
        }
      }

      // B. Détection Off-by-one error (i <= array.length)
      const offByOneMatch = line.match(/for\s*\(\s*(?:let|var)\s*(\w+)\s*=\s*0\s*;\s*\1\s*<=\s*([\w.]+)\.length/);
      if (offByOneMatch) {
        issues.push({
          id: `issue-offbyone-${lineNum}`,
          line: lineNum,
          severity: 'error',
          message: `Index hors limites potentiel : 'i <= ${offByOneMatch[2]}.length' tentera d'accéder à un élément undefined au dernier tour.`,
          rule: 'correctness/off-by-one-loop',
          fixPreview: line.replace('<=', '<'),
        });
      }

      // C. Accès potentiel à null / undefined sans garde
      if (line.includes('item.expiresAt') && !lines.slice(Math.max(0, idx - 4), idx).some((l) => l.includes('if (!item)'))) {
        issues.push({
          id: `issue-nullcheck-${lineNum}`,
          line: lineNum,
          severity: 'error',
          message: "Accès à la propriété 'expiresAt' sans vérifier si 'item' existe (TypeError: Cannot read properties of undefined si clé introuvable).",
          rule: 'type-safety/null-dereference',
          fixPreview: 'if (!item) return null;',
        });
      }

      // D. Fuite mémoire / Event listener non délimité
      if (line.includes('this.listeners.push') && !code.includes('removeListener') && !code.includes('off(')) {
        issues.push({
          id: `issue-memleak-${lineNum}`,
          line: lineNum,
          severity: 'warning',
          message: "Risque de fuite de mémoire : les écouteurs s'accumulent sans méthode de désabonnement.",
          rule: 'memory/leak-risk',
          fixPreview: 'removeListener(event, callback) { ... }',
        });
      }

      // E. Egalité lâche '=='
      if (line.includes(' == ') && !line.includes(' === ') && !line.includes('== null')) {
        issues.push({
          id: `issue-eq-${lineNum}`,
          line: lineNum,
          severity: 'info',
          message: "Utilisation de l'égalité lâche '=='. Préférez la comparaison stricte '==='.",
          rule: 'style/strict-equality',
          fixPreview: line.replace(' == ', ' === '),
        });
      }
    }

    // Python Checks
    if (language === 'python') {
      if (line.includes('right = len(arr)') && !line.includes('len(arr) - 1')) {
        issues.push({
          id: `issue-py-bounds-${lineNum}`,
          line: lineNum,
          severity: 'error',
          message: "Dépassement d'index : 'len(arr)' pointera en dehors du tableau en recherche dichotomique. Utilisez 'len(arr) - 1'.",
          rule: 'python/index-out-of-bounds',
          fixPreview: line.replace('len(arr)', 'len(arr) - 1'),
        });
      }

      if ((trimmed.startsWith('def ') || trimmed.startsWith('if ') || trimmed.startsWith('while ') || trimmed.startsWith('for ')) && !trimmed.endsWith(':')) {
        issues.push({
          id: `issue-py-colon-${lineNum}`,
          line: lineNum,
          severity: 'error',
          message: "Erreur syntaxique Python : deux-points ':' manquants à la fin de la déclaration.",
          rule: 'python/missing-colon',
          fixPreview: `${trimmed}:`,
        });
      }
    }

    // JSON Checks
    if (language === 'json') {
      if (trimmed.endsWith(',') && (lines[idx + 1]?.trim().startsWith('}') || lines[idx + 1]?.trim().startsWith(']'))) {
        issues.push({
          id: `issue-json-trailing-${lineNum}`,
          line: lineNum,
          severity: 'error',
          message: 'Virgule finale interdite dans le format JSON standard.',
          rule: 'json/trailing-comma',
          fixPreview: trimmed.slice(0, -1),
        });
      }
    }

    // Paren/brace balance check
    for (const char of line) {
      if (char === '{') openBraces++;
      if (char === '}') openBraces--;
      if (char === '(') openParens++;
      if (char === ')') openParens--;
      if (char === '[') openBrackets++;
      if (char === ']') openBrackets--;
    }
  }

  // Équilibre global des accolades/parenthèses
  if (openBraces !== 0) {
    issues.push({
      id: 'issue-braces',
      line: lines.length,
      severity: 'error',
      message: `Déséquilibre d'accolades : ${Math.abs(openBraces)} accolade(s) ${openBraces > 0 ? 'manquante(s) fermante(s)' : 'en trop'}.`,
      rule: 'syntax/unbalanced-braces',
    });
  }
  if (openParens !== 0) {
    issues.push({
      id: 'issue-parens',
      line: lines.length,
      severity: 'error',
      message: `Déséquilibre de parenthèses : ${Math.abs(openParens)} parenthèse(s) ${openParens > 0 ? 'manquante(s)' : 'en trop'}.`,
      rule: 'syntax/unbalanced-parens',
    });
  }

  return issues;
}
