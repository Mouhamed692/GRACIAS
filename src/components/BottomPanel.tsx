import React, { useState } from 'react';
import {
  Terminal,
  Bug,
  AlertCircle,
  Eye,
  Trash2,
  Play,
  Check,
  Wand2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import {
  ConsoleEntry,
  DiagnosticIssue,
  Breakpoint,
  AiDebugResult,
  CodeFile
} from '../types/editor';

interface BottomPanelProps {
  isOpen: boolean;
  onClose: () => void;
  consoleEntries: ConsoleEntry[];
  onClearConsole: () => void;
  onRunCode: () => void;
  isRunning: boolean;
  diagnostics: DiagnosticIssue[];
  onFixDiagnostic: (diag: DiagnosticIssue) => void;
  breakpoints: Breakpoint[];
  onToggleBreakpoint: (line: number) => void;
  aiDebugResult: AiDebugResult | null;
  isAiDebugging: boolean;
  onRunAiDebugger: () => void;
  onApplyAiDebugFix: (fixedCode: string) => void;
  currentFile: CodeFile;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  isOpen,
  onClose,
  consoleEntries,
  onClearConsole,
  onRunCode,
  isRunning,
  diagnostics,
  onFixDiagnostic,
  breakpoints,
  onToggleBreakpoint,
  aiDebugResult,
  isAiDebugging,
  onRunAiDebugger,
  onApplyAiDebugFix,
  currentFile,
}) => {
  const [activeTab, setActiveTab] = useState<'console' | 'diagnostics' | 'aidebug' | 'watch'>('console');
  const [watchExpr, setWatchExpr] = useState('');
  const [watchedVars, setWatchedVars] = useState<Array<{ expr: string; value: string }>>([
    { expr: 'this.taxRate', value: '0.2' },
    { expr: 'items.length', value: '2' },
    { expr: 'discountAmount', value: '121.798' },
  ]);

  if (!isOpen) return null;

  const errorCount = diagnostics.filter((d) => d.severity === 'error').length;
  const consoleErrorCount = consoleEntries.filter((e) => e.type === 'error').length;

  const handleAddWatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!watchExpr.trim()) return;
    setWatchedVars((prev) => [
      ...prev,
      { expr: watchExpr.trim(), value: 'Évalué au point d’arrêt' },
    ]);
    setWatchExpr('');
  };

  return (
    <div className="h-64 border-t border-[#232730] bg-[#0e1016] flex flex-col select-none z-20 transition-all">
      {/* Panel Tab Bar */}
      <div className="h-9 bg-[#12141c] border-b border-[#232730] flex items-center justify-between px-3">
        <div className="flex items-center gap-1">
          {/* Console Tab */}
          <button
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t text-xs font-medium transition cursor-pointer border-t-2 ${
              activeTab === 'console'
                ? 'bg-[#0e1016] text-white border-indigo-500'
                : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-[#181a24]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Terminal & Console</span>
            {consoleErrorCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500/80 text-[10px] text-white flex items-center justify-center font-mono">
                {consoleErrorCount}
              </span>
            )}
          </button>

          {/* Diagnostics Tab */}
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t text-xs font-medium transition cursor-pointer border-t-2 ${
              activeTab === 'diagnostics'
                ? 'bg-[#0e1016] text-white border-indigo-500'
                : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-[#181a24]'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Diagnostics & Problèmes</span>
            {errorCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-[10px] text-white flex items-center justify-center font-mono font-bold animate-pulse">
                {errorCount}
              </span>
            )}
          </button>

          {/* AI Debugger Deep Analysis Tab */}
          <button
            onClick={() => setActiveTab('aidebug')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t text-xs font-medium transition cursor-pointer border-t-2 ${
              activeTab === 'aidebug'
                ? 'bg-[#0e1016] text-purple-200 border-purple-500'
                : 'text-zinc-400 hover:text-purple-300 border-transparent hover:bg-[#181a24]'
            }`}
          >
            <Bug className="w-3.5 h-3.5 text-purple-400" />
            <span>Débogueur IA Approfondi</span>
            {aiDebugResult && (
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            )}
          </button>

          {/* Watch Expressions Tab */}
          <button
            onClick={() => setActiveTab('watch')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t text-xs font-medium transition cursor-pointer border-t-2 ${
              activeTab === 'watch'
                ? 'bg-[#0e1016] text-white border-indigo-500'
                : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-[#181a24]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Espion & Points d’arrêt</span>
            {breakpoints.length > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 text-[10px] font-mono border border-rose-800">
                {breakpoints.length}
              </span>
            )}
          </button>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2">
          {activeTab === 'console' && (
            <>
              <button
                onClick={onRunCode}
                disabled={isRunning}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-medium border border-emerald-500/40 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Exécuter</span>
              </button>
              <button
                onClick={onClearConsole}
                className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-[#20232e] cursor-pointer"
                title="Effacer la console"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-[#20232e] cursor-pointer"
            title="Fermer le panneau"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Panel Content Area */}
      <div className="flex-1 overflow-auto p-2 font-mono text-xs">
        {/* 1. Terminal & Console View */}
        {activeTab === 'console' && (
          <div className="space-y-1">
            {consoleEntries.length === 0 ? (
              <div className="text-zinc-500 py-6 text-center font-sans">
                La console est vide. Cliquez sur <span className="text-emerald-400 font-semibold font-mono">Exécuter (F5)</span> pour lancer le script.
              </div>
            ) : (
              consoleEntries.map((entry) => {
                let badgeColor = 'text-zinc-400';
                let rowBg = '';
                if (entry.type === 'error') {
                  badgeColor = 'text-rose-400 font-bold';
                  rowBg = 'bg-rose-950/20 border-l-2 border-rose-500 pl-2 py-1';
                } else if (entry.type === 'warn') {
                  badgeColor = 'text-amber-400';
                  rowBg = 'bg-amber-950/20 border-l-2 border-amber-500 pl-2 py-1';
                } else if (entry.type === 'system') {
                  badgeColor = 'text-indigo-400';
                }

                return (
                  <div
                    key={entry.id}
                    className={`flex items-start justify-between gap-3 text-xs leading-relaxed ${rowBg}`}
                  >
                    <div className="flex items-start gap-2 overflow-x-auto">
                      <span className="text-[10px] text-zinc-500 shrink-0 mt-0.5">
                        {entry.timestamp}
                      </span>
                      <span className={`shrink-0 ${badgeColor}`}>
                        [{entry.type.toUpperCase()}]
                      </span>
                      <pre className="whitespace-pre-wrap font-mono text-zinc-200">
                        {entry.message}
                      </pre>
                    </div>

                    {entry.type === 'error' && (
                      <button
                        onClick={onRunAiDebugger}
                        className="shrink-0 px-2 py-0.5 rounded bg-rose-600/40 hover:bg-rose-600/60 border border-rose-500/50 text-rose-200 text-[10px] font-sans flex items-center gap-1 cursor-pointer transition"
                      >
                        <Wand2 className="w-3 h-3" />
                        <span>Déboguer avec IA</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 2. Diagnostics & Issues View */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-1.5 font-sans">
            {diagnostics.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-zinc-400">
                <Check className="w-8 h-8 text-emerald-400 mb-2" />
                <span className="font-semibold text-emerald-300">
                  Aucun problème statique détecté
                </span>
                <span className="text-xs text-zinc-500 mt-1">
                  Le code respecte les règles d'intégrité syntaxique et logique.
                </span>
              </div>
            ) : (
              diagnostics.map((diag) => (
                <div
                  key={diag.id}
                  className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 transition ${
                    diag.severity === 'error'
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : 'bg-amber-950/20 border-amber-500/30'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0 mt-0.5 ${
                        diag.severity === 'error'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      Ligne {diag.line}
                    </span>
                    <div>
                      <div className="text-xs text-zinc-200 font-medium">
                        {diag.message}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                        Règle : {diag.rule}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onFixDiagnostic(diag)}
                    className="shrink-0 px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-200 text-xs font-medium flex items-center gap-1 cursor-pointer transition shadow-sm"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Auto-Fix</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* 3. Deep AI Debugger View */}
        {activeTab === 'aidebug' && (
          <div className="font-sans space-y-3">
            {isAiDebugging ? (
              <div className="flex flex-col items-center justify-center py-8 text-purple-300">
                <Sparkles className="w-8 h-8 animate-spin text-purple-400 mb-2" />
                <span className="font-semibold text-sm">
                  L'IA analyse le code, les logs et la pile d'exécution...
                </span>
                <span className="text-xs text-zinc-400 mt-1">
                  Détection des causes racines et élaboration du correctif complet.
                </span>
              </div>
            ) : !aiDebugResult ? (
              <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
                <Bug className="w-8 h-8 text-zinc-500 mb-2" />
                <span className="text-sm font-medium text-zinc-300">
                  Aucune analyse de débogage en mémoire
                </span>
                <span className="text-xs text-zinc-500 mt-1">
                  Cliquez sur "Débogueur IA" dans la barre supérieure pour lancer une session.
                </span>
                <button
                  onClick={onRunAiDebugger}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-950/40"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Démarrer l’analyse IA</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 animate-in fade-in">
                {/* Root Cause Banner */}
                <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-800/40 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-purple-200 mb-1 text-sm">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Diagnostic de la Cause Racine :</span>
                  </div>
                  <p className="text-purple-100/90 leading-relaxed font-sans">
                    {aiDebugResult.rootCause}
                  </p>
                </div>

                {/* Changes Made */}
                {aiDebugResult.changesMade?.length > 0 && (
                  <div className="p-3 rounded-lg bg-[#141722] border border-[#262b3c] text-xs">
                    <div className="font-semibold text-zinc-200 mb-1.5">
                      Modifications apportées par le correctif :
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-zinc-300">
                      {aiDebugResult.changesMade.map((ch, idx) => (
                        <li key={idx}>{ch}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action to Apply Fix */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/40">
                  <div>
                    <div className="text-xs font-bold text-emerald-300">
                      Correctif prêt à être appliqué
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Remplace le code source par la version corrigée et sécurisée.
                    </div>
                  </div>

                  <button
                    onClick={() => onApplyAiDebugFix(aiDebugResult.fixedCode)}
                    className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-950/50"
                  >
                    <Check className="w-4 h-4" />
                    <span>Appliquer la correction au fichier</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. Watch Expressions & Breakpoints View */}
        {activeTab === 'watch' && (
          <div className="space-y-3 font-sans">
            {/* Breakpoints section */}
            <div>
              <div className="text-xs font-bold text-zinc-300 mb-1">
                Points d’arrêt actifs ({breakpoints.length})
              </div>
              {breakpoints.length === 0 ? (
                <div className="text-xs text-zinc-500">
                  Cliquez sur la marge gauche de l'éditeur pour ajouter un point d'arrêt.
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {breakpoints.map((bp) => (
                    <button
                      key={bp.line}
                      onClick={() => onToggleBreakpoint(bp.line)}
                      className="px-2 py-0.5 rounded bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs font-mono flex items-center gap-1 cursor-pointer"
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>Ligne {bp.line}</span>
                      <X className="w-3 h-3 hover:text-white" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Watch Expression Input */}
            <div className="pt-2 border-t border-[#232730]">
              <form onSubmit={handleAddWatch} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Ajouter une expression à espionner (ex: items.length)..."
                  value={watchExpr}
                  onChange={(e) => setWatchExpr(e.target.value)}
                  className="flex-1 bg-[#141722] border border-[#2a2f42] rounded px-2.5 py-1 text-xs text-white outline-none font-mono focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-xs text-white font-medium cursor-pointer"
                >
                  Ajouter
                </button>
              </form>

              <div className="space-y-1">
                {watchedVars.map((v, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-1.5 rounded bg-[#131620] border border-[#222736] text-xs font-mono"
                  >
                    <span className="text-sky-300">{v.expr}</span>
                    <span className="text-emerald-400 font-semibold">{v.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
