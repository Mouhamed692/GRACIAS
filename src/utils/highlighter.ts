import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import { SupportedLanguage } from '../types/editor';

const LANGUAGE_MAP: Record<SupportedLanguage, string> = {
  typescript: 'typescript',
  javascript: 'javascript',
  python: 'python',
  json: 'json',
  html: 'html',
  css: 'css',
};

export function highlightCode(code: string, language: SupportedLanguage): string {
  const grammarLang = LANGUAGE_MAP[language] || 'javascript';
  const grammar = Prism.languages[grammarLang] || Prism.languages.javascript;
  
  if (!grammar) {
    return escapeHtml(code);
  }

  return Prism.highlight(code, grammar, grammarLang);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
