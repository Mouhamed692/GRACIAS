import React from 'react';
import {
  Play,
  Bug,
  Sparkles,
  Terminal,
  MessageSquareCode,
  Keyboard,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  GitBranch
} from 'lucide-react';
import { CodeFile, DiagnosticIssue } from '../types/editor';

interface HeaderProps {
  currentFile: CodeFile;
  files: CodeFile[];
  onSelectFile: (file: CodeFile) => void;
  isRunning: boolean;
  onRunCode: () => void;
  onRunAiDebugger: () => void;
  isAiDebugging: boolean;
  diagnostics: DiagnosticIssue[];
  isTabCompletionEnabled: boolean;
  onToggleTabCompletion: () => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
  isBottomPanelOpen: boolean;
  onToggleBottomPanel: () => void;
  onResetWorkspace: () => void;
  onOpenShortcuts: () => void;
  currentBranch?: string;
  modifiedCount?: number;
  onOpenGit?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentFile,
  files,
  onSelectFile,
  isRunning,
  onRunCode,
  onRunAiDebugger,
  isAiDebugging,
  diagnostics,
  isTabCompletionEnabled,
  onToggleTabCompletion,
  isChatOpen,
  onToggleChat,
  isBottomPanelOpen,
  onToggleBottomPanel,
  onResetWorkspace,
  onOpenShortcuts,
  currentBranch = 'main',
  modifiedCount = 0,
  onOpenGit,
}) => {
  const errorCount = diagnostics.filter((d) => d.severity === 'error').length;
  const warningCount = diagnostics.filter((d) => d.severity === 'warning').length;

  return (
    <header className="h-12 border-b border-[#232730] bg-[#12141a] px-3 flex items-center justify-between select-none z-20">
      {/* Left: Brand & File Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-900/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm tracking-tight text-white font-mono">GRACIAS</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              AI Studio
            </span>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-[#2a2e39]" />

        {/* File Quick Switcher */}
        <div className="flex items-center gap-1 bg-[#1a1d24] px-2 py-1 rounded-md border border-[#2b303c] text-xs">
          <FolderOpen className="w-3.5 h-3.5 text-zinc-400" />
          <select
            value={currentFile.id}
            onChange={(e) => {
              const file = files.find((f) => f.id === e.target.value);
              if (file) onSelectFile(file);
            }}
            className="bg-transparent text-zinc-200 text-xs font-mono focus:outline-none cursor-pointer pr-1"
          >
            {files.map((f) => (
              <option key={f.id} value={f.id} className="bg-[#1a1d24] text-zinc-200">
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Git Branch & Status Badge */}
        {onOpenGit && (
          <button
            onClick={onOpenGit}
            className="flex items-center gap-1.5 bg-[#1a1d24] hover:bg-[#222634] px-2 py-1 rounded-md border border-[#2b303c] text-xs text-zinc-300 font-mono transition cursor-pointer"
            title="Ouvrir le panneau Git Source Control"
          >
            <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate max-w-24">{currentBranch}</span>
            {modifiedCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        )}

        {/* Real-time Diagnostics Badge */}
        <button
          onClick={onToggleBottomPanel}
          className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border transition-all ${
            errorCount > 0
              ? 'bg-rose-500/10 border-rose-500/40 text-rose-300 hover:bg-rose-500/20'
              : warningCount > 0
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
          }`}
          title="Cliquez pour afficher les diagnostics"
        >
          {errorCount > 0 ? (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-mono font-medium">{errorCount} erreur{errorCount > 1 ? 's' : ''}</span>
            </>
          ) : warningCount > 0 ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono font-medium">{warningCount} warning{warningCount > 1 ? 's' : ''}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>0 problème</span>
            </>
          )}
        </button>
      </div>

      {/* Center: Core Actions (Run & AI Debugger) */}
      <div className="flex items-center gap-2">
        {/* Run Code Button */}
        <button
          onClick={onRunCode}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition shadow-sm disabled:opacity-50 cursor-pointer"
          title="Exécuter le code (F5)"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Exécution...' : 'Exécuter'}</span>
          <kbd className="hidden sm:inline text-[10px] bg-emerald-700/60 px-1 rounded font-mono">F5</kbd>
        </button>

        {/* AI Real-Time Debugger Button */}
        <button
          onClick={onRunAiDebugger}
          disabled={isAiDebugging}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white transition active:scale-95 cursor-pointer shadow-sm ${
            errorCount > 0
              ? 'bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 shadow-rose-900/30 ring-1 ring-rose-400/40 animate-pulse'
              : 'bg-[#252934] hover:bg-[#2e3342] text-zinc-200 border border-[#3b4050]'
          }`}
          title="Lancer l'analyse et la correction automatique par l'IA"
        >
          <Bug className={`w-3.5 h-3.5 ${isAiDebugging ? 'animate-bounce text-yellow-300' : 'text-rose-400'}`} />
          <span>{isAiDebugging ? 'Diagnostic IA en cours...' : 'Débogueur IA'}</span>
          {errorCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-700 font-mono font-bold">
              Auto-Fix
            </span>
          )}
        </button>
      </div>

      {/* Right: Tools & AI Feature Toggles */}
      <div className="flex items-center gap-2">
        {/* Cursor Tab Toggle */}
        <button
          onClick={onToggleTabCompletion}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition cursor-pointer ${
            isTabCompletionEnabled
              ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
              : 'bg-[#1a1d24] border-[#2b303c] text-zinc-400 hover:text-zinc-200'
          }`}
          title="Active ou désactive la complétion inline GRACIAS Tab"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline font-mono">GRACIAS Tab</span>
          <span className={`w-1.5 h-1.5 rounded-full ${isTabCompletionEnabled ? 'bg-indigo-400 animate-pulse' : 'bg-zinc-600'}`} />
        </button>

        {/* Toggle Terminal / Console */}
        <button
          onClick={onToggleBottomPanel}
          className={`p-1.5 rounded-md text-xs border transition cursor-pointer ${
            isBottomPanelOpen
              ? 'bg-[#2b303c] border-zinc-600 text-white'
              : 'bg-[#1a1d24] border-[#2b303c] text-zinc-400 hover:text-zinc-200'
          }`}
          title="Afficher/masquer le Terminal & Console"
        >
          <Terminal className="w-4 h-4" />
        </button>

        {/* Toggle AI Composer / Chat */}
        <button
          onClick={onToggleChat}
          className={`p-1.5 rounded-md text-xs border transition cursor-pointer ${
            isChatOpen
              ? 'bg-purple-600/30 border-purple-500/60 text-purple-200'
              : 'bg-[#1a1d24] border-[#2b303c] text-zinc-400 hover:text-zinc-200'
          }`}
          title="Afficher/masquer GRACIAS Composer & Chat (Cmd+L)"
        >
          <MessageSquareCode className="w-4 h-4" />
        </button>

        {/* Shortcuts Cheat Sheet */}
        <button
          onClick={onOpenShortcuts}
          className="p-1.5 rounded-md text-xs bg-[#1a1d24] border border-[#2b303c] text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
          title="Raccourcis clavier GRACIAS AI"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Reset Workspace */}
        <button
          onClick={onResetWorkspace}
          className="p-1.5 rounded-md text-xs bg-[#1a1d24] border border-[#2b303c] text-zinc-400 hover:text-rose-400 transition cursor-pointer"
          title="Réinitialiser les fichiers du projet"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
