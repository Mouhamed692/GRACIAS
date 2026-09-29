export type SupportedLanguage = 'typescript' | 'javascript' | 'python' | 'json' | 'html' | 'css';

export interface CodeFile {
  id: string;
  name: string;
  language: SupportedLanguage;
  content: string;
  isModified?: boolean;
  hasErrors?: boolean;
}

export interface DiagnosticIssue {
  id: string;
  line: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  rule?: string;
  fixPreview?: string;
}

export interface ConsoleEntry {
  id: string;
  type: 'log' | 'warn' | 'error' | 'info' | 'system';
  message: string;
  timestamp: string;
  line?: number;
  data?: any;
}

export interface Breakpoint {
  line: number;
  enabled: boolean;
}

export interface GhostCompletion {
  text: string;
  prefix: string;
  line: number;
  column: number;
  timestamp: number;
}

export interface InlineEditState {
  isOpen: boolean;
  startLine: number;
  endLine: number;
  selectedText: string;
  prompt: string;
  isLoading: boolean;
  proposedCode?: string;
  explanation?: string;
  error?: string;
}

export interface AiDebugResult {
  issuesFound: Array<{
    line: number;
    severity: 'error' | 'warning' | 'info';
    title: string;
    description: string;
    fixPreview?: string;
  }>;
  rootCause: string;
  fixedCode: string;
  changesMade: string[];
  testAdvice?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  fileContext?: string;
  isStreaming?: boolean;
  codeSnippet?: string;
}

export interface GitCommit {
  id: string;
  hash: string;
  message: string;
  author: string;
  date: string;
  files: string[];
}

export interface FileGitStatus {
  fileId: string;
  fileName: string;
  status: 'modified' | 'added' | 'deleted';
  staged: boolean;
  originalContent: string;
}

export type TestStatus = 'idle' | 'running' | 'passed' | 'failed' | 'skipped';

export interface TestCase {
  id: string;
  title: string;
  status: TestStatus;
  durationMs?: number;
  errorMessage?: string;
  expected?: string;
  actual?: string;
  line?: number;
}

export interface TestSuite {
  id: string;
  fileName: string;
  suiteName: string;
  testCode: string;
  status: TestStatus;
  tests: TestCase[];
  durationMs?: number;
}

export interface TestRunSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
}
