import React, { useState } from 'react';
import {
  TestTube2,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronRight,
  FileCode,
  Copy,
  Check,
  AlertTriangle,
  Wand2,
  Filter
} from 'lucide-react';
import { CodeFile, TestSuite, TestCase, TestRunSummary } from '../types/editor';

interface TestsPanelProps {
  currentFile: CodeFile;
  testSuite: TestSuite;
  isRunningTests: boolean;
  onRunAllTests: () => void;
  onGenerateAiTests: () => void;
  isGeneratingAiTests: boolean;
  onAutoFixTestError?: (errorMessage: string) => void;
}

export const TestsPanel: React.FC<TestsPanelProps> = ({
  currentFile,
  testSuite,
  isRunningTests,
  onRunAllTests,
  onGenerateAiTests,
  isGeneratingAiTests,
  onAutoFixTestError,
}) => {
  const [filter, setFilter] = useState<'all' | 'failed' | 'passed'>('all');
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [showTestCode, setShowTestCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const tests = testSuite.tests || [];
  const passedCount = tests.filter((t) => t.status === 'passed').length;
  const failedCount = tests.filter((t) => t.status === 'failed').length;
  const totalCount = tests.length;

  const filteredTests = tests.filter((t) => {
    if (filter === 'failed') return t.status === 'failed';
    if (filter === 'passed') return t.status === 'passed';
    return true;
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText(testSuite.testCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="w-56 flex flex-col justify-between h-full bg-[#12141a] text-zinc-300 select-none text-xs">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-9 px-3 border-b border-[#232730] flex items-center justify-between text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
          <div className="flex items-center gap-1.5 text-zinc-300">
            <TestTube2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Tests Unitaires</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onRunAllTests}
              disabled={isRunningTests || totalCount === 0}
              className="p-1 rounded hover:bg-emerald-950/50 text-emerald-400 hover:text-emerald-300 transition cursor-pointer disabled:opacity-40"
              title="Lancer tous les tests (Vitest)"
            >
              {isRunningTests ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
            </button>

            <button
              onClick={onGenerateAiTests}
              disabled={isGeneratingAiTests || isRunningTests}
              className="p-1 rounded hover:bg-purple-950/50 text-purple-400 hover:text-purple-300 transition cursor-pointer disabled:opacity-40"
              title="Générer une suite de tests complète avec l'IA"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAiTests ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Target File Info Bar */}
        <div className="px-2.5 py-1.5 border-b border-[#232730] bg-[#0e1016] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 truncate">
            <FileCode className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="font-mono text-zinc-300 truncate">{currentFile.name}</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Vitest / Jest</span>
        </div>

        {/* Stats & Progress Bar */}
        <div className="p-2.5 border-b border-[#232730] bg-[#101219]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">
                {passedCount}/{totalCount}
              </span>
              <span className="text-zinc-500 text-[11px]">validés</span>
            </div>

            {testSuite.durationMs !== undefined && (
              <span className="text-[10px] text-zinc-500 font-mono">
                {testSuite.durationMs}ms
              </span>
            )}
          </div>

          {/* Pass/Fail Progress Bar */}
          <div className="w-full h-1.5 bg-[#202430] rounded-full overflow-hidden flex">
            {totalCount > 0 ? (
              <>
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${(passedCount / totalCount) * 100}%` }}
                />
                <div
                  className="bg-rose-500 h-full transition-all duration-300"
                  style={{ width: `${(failedCount / totalCount) * 100}%` }}
                />
              </>
            ) : (
              <div className="bg-zinc-700 h-full w-full" />
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 mt-2 font-sans">
            <button
              onClick={() => setFilter('all')}
              className={`px-1.5 py-0.5 rounded text-[10px] transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-zinc-700 text-white font-semibold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Tous ({totalCount})
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-1.5 py-0.5 rounded text-[10px] transition cursor-pointer ${
                filter === 'failed'
                  ? 'bg-rose-950/60 text-rose-300 font-semibold border border-rose-800/40'
                  : 'text-zinc-500 hover:text-rose-400'
              }`}
            >
              Échecs ({failedCount})
            </button>
            <button
              onClick={() => setFilter('passed')}
              className={`px-1.5 py-0.5 rounded text-[10px] transition cursor-pointer ${
                filter === 'passed'
                  ? 'bg-emerald-950/60 text-emerald-300 font-semibold border border-emerald-800/40'
                  : 'text-zinc-500 hover:text-emerald-400'
              }`}
            >
              Succès ({passedCount})
            </button>
          </div>
        </div>

        {/* Tests Tree List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredTests.length === 0 ? (
            <div className="py-8 text-center text-zinc-500">
              <TestTube2 className="w-6 h-6 mx-auto mb-2 text-zinc-600 opacity-60" />
              <span>Aucun test à afficher</span>
            </div>
          ) : (
            filteredTests.map((test) => {
              const isExpanded = expandedTestId === test.id;
              const isFailed = test.status === 'failed';

              return (
                <div
                  key={test.id}
                  className={`rounded-lg border transition text-xs ${
                    isFailed
                      ? 'bg-rose-950/15 border-rose-900/30'
                      : test.status === 'passed'
                      ? 'bg-[#151822] border-[#222634]'
                      : 'bg-[#141620] border-[#202432]'
                  }`}
                >
                  <div
                    onClick={() => setExpandedTestId(isExpanded ? null : test.id)}
                    className="p-2 flex items-start gap-2 cursor-pointer hover:bg-[#1b1f2c] rounded-lg transition"
                  >
                    {/* Status Icon */}
                    <div className="mt-0.5 shrink-0">
                      {test.status === 'passed' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      {test.status === 'failed' && (
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      )}
                      {test.status === 'running' && (
                        <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                      )}
                      {test.status === 'idle' && (
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-medium text-zinc-200 line-clamp-2 leading-tight">
                          {test.title}
                        </span>
                      </div>

                      {test.durationMs !== undefined && (
                        <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                          {test.durationMs}ms
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Failure Details & AI Auto-Fix */}
                  {isExpanded && isFailed && (
                    <div className="p-2 border-t border-rose-900/40 bg-rose-950/30 text-[11px] font-mono space-y-1.5">
                      {test.errorMessage && (
                        <div className="text-rose-300 font-medium">
                          {test.errorMessage}
                        </div>
                      )}

                      {test.expected && (
                        <div className="text-emerald-400/90">
                          <span className="text-zinc-500 font-sans">Attendu:</span> {test.expected}
                        </div>
                      )}

                      {test.actual && (
                        <div className="text-rose-400">
                          <span className="text-zinc-500 font-sans">Reçu:</span> {test.actual}
                        </div>
                      )}

                      {onAutoFixTestError && test.errorMessage && (
                        <button
                          onClick={() => onAutoFixTestError(test.errorMessage!)}
                          className="mt-1 w-full py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 flex items-center justify-center gap-1.5 font-sans font-medium text-[11px] transition cursor-pointer"
                        >
                          <Wand2 className="w-3 h-3 text-indigo-300" />
                          <span>Résoudre avec l'IA</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Test Code Viewer Drawer Button */}
        {testSuite.testCode && (
          <div className="p-2 border-t border-[#232730] bg-[#0e1016]">
            <button
              onClick={() => setShowTestCode(!showTestCode)}
              className="w-full py-1 px-2 rounded bg-[#181a24] hover:bg-[#202432] text-zinc-300 border border-[#262a38] text-[11px] flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                <span>Code du test (Vitest)</span>
              </div>
              {showTestCode ? (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              )}
            </button>

            {showTestCode && (
              <div className="mt-2 p-2 rounded bg-[#13151e] border border-[#222634] max-h-48 overflow-y-auto font-mono text-[10px] text-zinc-300 relative group">
                <button
                  onClick={handleCopyCode}
                  className="absolute right-2 top-2 p-1 rounded bg-[#202534] hover:bg-[#282f42] text-zinc-300 transition cursor-pointer"
                  title="Copier le code de test"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
                <pre className="whitespace-pre-wrap leading-relaxed pr-6">
                  {testSuite.testCode}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-[#232730] bg-[#0e1016] text-[10px] text-zinc-500 font-mono flex items-center justify-between">
        <span>Test Runner • Vitest</span>
        <button
          onClick={onRunAllTests}
          disabled={isRunningTests}
          className="text-indigo-400 hover:text-indigo-300 cursor-pointer font-semibold"
        >
          {isRunningTests ? 'En cours...' : 'Exécuter'}
        </button>
      </div>
    </div>
  );
};
