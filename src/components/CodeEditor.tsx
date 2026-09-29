import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  CodeFile,
  DiagnosticIssue,
  Breakpoint,
  GhostCompletion,
} from '../types/editor';
import { highlightCode } from '../utils/highlighter';
import { Sparkles, Wand2, X, ChevronRight, Bug, AlertTriangle, AlertCircle } from 'lucide-react';

interface CodeEditorProps {
  currentFile: CodeFile;
  openFiles: CodeFile[];
  onSelectFile: (file: CodeFile) => void;
  onCloseFile: (fileId: string) => void;
  onCodeChange: (newCode: string) => void;
  diagnostics: DiagnosticIssue[];
  breakpoints: Breakpoint[];
  onToggleBreakpoint: (line: number) => void;
  ghostCompletion: GhostCompletion | null;
  onAcceptGhostCompletion: () => void;
  onDismissGhostCompletion: () => void;
  onTriggerInlineEdit: (startLine: number, endLine: number, text: string) => void;
  onFixDiagnostic: (diagnostic: DiagnosticIssue) => void;
  onRunAiDebugger: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  currentFile,
  openFiles,
  onSelectFile,
  onCloseFile,
  onCodeChange,
  diagnostics,
  breakpoints,
  onToggleBreakpoint,
  ghostCompletion,
  onAcceptGhostCompletion,
  onDismissGhostCompletion,
  onTriggerInlineEdit,
  onFixDiagnostic,
  onRunAiDebugger,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1, index: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [hoveredDiagnostic, setHoveredDiagnostic] = useState<{
    issue: DiagnosticIssue;
    y: number;
  } | null>(null);

  const lines = useMemo(() => currentFile.content.split('\n'), [currentFile.content]);

  // Synchroniser le scroll entre le textarea et le backdrop coloré
  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Calcul de la position du curseur
  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const textBeforeCursor = textarea.value.substring(0, textarea.selectionStart);
    const lineList = textBeforeCursor.split('\n');
    const currentLine = lineList.length;
    const currentColumn = lineList[lineList.length - 1].length + 1;

    setCursorPos({
      line: currentLine,
      column: currentColumn,
      index: textarea.selectionStart,
    });

    const selected = textarea.value.substring(
      textarea.selectionStart,
      textarea.selectionEnd
    );
    setSelectedText(selected);
  };

  // Gestion des raccourcis clavier dans l'éditeur (Tab pour complétion, Cmd+K, etc.)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 1. Accepter la complétion Cursor Tab
    if (e.key === 'Tab' && ghostCompletion && ghostCompletion.text) {
      e.preventDefault();
      onAcceptGhostCompletion();
      return;
    }

    // 2. Rejeter la complétion avec Échap
    if (e.key === 'Escape' && ghostCompletion) {
      e.preventDefault();
      onDismissGhostCompletion();
      return;
    }

    // 3. Raccourci Cmd+K / Ctrl+K pour l'Inline Edit
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const selStart = textarea.selectionStart;
      const selEnd = textarea.selectionEnd;
      const fullText = textarea.value;

      const startLine = fullText.substring(0, selStart).split('\n').length;
      const endLine = fullText.substring(0, selEnd).split('\n').length;
      const text = fullText.substring(selStart, selEnd) || fullText.split('\n')[startLine - 1] || '';

      onTriggerInlineEdit(startLine, endLine, text);
      return;
    }

    // Tabulation classique (indente 2 espaces si pas de ghost text)
    if (e.key === 'Tab' && !ghostCompletion) {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText =
        currentFile.content.substring(0, start) +
        '  ' +
        currentFile.content.substring(end);

      onCodeChange(newText);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
        updateCursorPosition();
      }, 0);
    }
  };

  // Diagnostic map par ligne
  const diagnosticsByLine = useMemo(() => {
    const map = new Map<number, DiagnosticIssue>();
    for (const d of diagnostics) {
      if (!map.has(d.line)) {
        map.set(d.line, d);
      }
    }
    return map;
  }, [diagnostics]);

  // Breakpoints map par ligne
  const breakpointMap = useMemo(() => {
    const map = new Map<number, boolean>();
    for (const b of breakpoints) {
      map.set(b.line, b.enabled);
    }
    return map;
  }, [breakpoints]);

  // Code surligné avec Prism
  const highlightedCode = useMemo(() => {
    return highlightCode(currentFile.content, currentFile.language);
  }, [currentFile.content, currentFile.language]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d0e12] overflow-hidden relative">
      {/* File Tabs Bar */}
      <div className="h-9 bg-[#111319] border-b border-[#232730] flex items-center justify-between px-2 select-none overflow-x-auto">
        <div className="flex items-center gap-1">
          {openFiles.map((file) => {
            const isActive = file.id === currentFile.id;
            return (
              <div
                key={file.id}
                onClick={() => onSelectFile(file)}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-t text-xs font-mono transition cursor-pointer border-t-2 ${
                  isActive
                    ? 'bg-[#0d0e12] text-zinc-100 border-indigo-500 font-medium'
                    : 'bg-[#14161f] text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-[#1a1c26]'
                }`}
              >
                <span>{file.name}</span>
                {file.isModified && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}
                {openFiles.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseFile(file.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:bg-[#2b3040] p-0.5 rounded transition text-zinc-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Cmd+K Button on Selection */}
        {selectedText && (
          <button
            onClick={() => {
              if (!textareaRef.current) return;
              const selStart = textareaRef.current.selectionStart;
              const selEnd = textareaRef.current.selectionEnd;
              const startLine = currentFile.content.substring(0, selStart).split('\n').length;
              const endLine = currentFile.content.substring(0, selEnd).split('\n').length;
              onTriggerInlineEdit(startLine, endLine, selectedText);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-medium transition cursor-pointer animate-in fade-in"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span>Modifier avec IA (Cmd+K)</span>
          </button>
        )}
      </div>

      {/* Breadcrumb Path */}
      <div className="h-6 bg-[#0f1015] border-b border-[#1f222a] px-3 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
        <div className="flex items-center gap-1.5">
          <span>src</span>
          <ChevronRight className="w-3 h-3 text-zinc-600" />
          <span className="text-zinc-300">{currentFile.name}</span>
        </div>

        <div className="flex items-center gap-3 text-zinc-400">
          <span>{currentFile.language.toUpperCase()}</span>
          <span>
            Ln {cursorPos.line}, Col {cursorPos.column}
          </span>
        </div>
      </div>

      {/* Main Code Editing Canvas */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Line Numbers Gutter & Breakpoints */}
        <div className="w-14 bg-[#0d0e12] border-r border-[#1f222a] select-none py-3 text-right pr-3 font-mono text-xs text-zinc-600 flex flex-col z-10">
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const hasBreakpoint = breakpointMap.get(lineNum);
            const diag = diagnosticsByLine.get(lineNum);
            const isCurrentLine = cursorPos.line === lineNum;

            return (
              <div
                key={lineNum}
                className="h-6 flex items-center justify-end gap-1.5 group relative cursor-pointer"
                onClick={() => onToggleBreakpoint(lineNum)}
              >
                {/* Breakpoint indicator */}
                <div
                  className={`w-2.5 h-2.5 rounded-full transition ${
                    hasBreakpoint
                      ? 'bg-rose-500 shadow-sm shadow-rose-500/80'
                      : 'opacity-0 group-hover:opacity-60 bg-rose-500/60'
                  }`}
                  title={hasBreakpoint ? 'Retirer le point d’arrêt' : 'Ajouter un point d’arrêt'}
                />

                {/* Diagnostic mark (error / warning) */}
                {diag && (
                  <div
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredDiagnostic({ issue: diag, y: rect.top });
                    }}
                    onMouseLeave={() => setHoveredDiagnostic(null)}
                    className="cursor-pointer"
                  >
                    {diag.severity === 'error' ? (
                      <span className="w-2 h-2 rounded-full bg-rose-500 block ring-2 ring-rose-900 animate-pulse" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-amber-400 block ring-2 ring-amber-900" />
                    )}
                  </div>
                )}

                {/* Line number */}
                <span
                  className={`text-[11px] font-mono ${
                    isCurrentLine ? 'text-zinc-200 font-semibold' : 'text-zinc-600'
                  }`}
                >
                  {lineNum}
                </span>
              </div>
            );
          })}
        </div>

        {/* Code Canvas Area: Synchronized Backdrop & Textarea */}
        <div className="flex-1 relative overflow-hidden">
          {/* Syntax Highlighted Backdrop */}
          <div
            ref={backdropRef}
            className="absolute inset-0 p-3 pl-4 font-mono text-xs leading-6 overflow-hidden pointer-events-none whitespace-pre select-none"
            aria-hidden="true"
          >
            <div
              className="font-mono text-xs leading-6"
              dangerouslySetInnerHTML={{ __html: highlightedCode + '\n' }}
            />
          </div>

          {/* Transparent Input Textarea */}
          <textarea
            ref={textareaRef}
            value={currentFile.content}
            onChange={(e) => {
              onCodeChange(e.target.value);
              updateCursorPosition();
            }}
            onScroll={handleScroll}
            onSelect={updateCursorPosition}
            onClick={updateCursorPosition}
            onKeyUp={updateCursorPosition}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="absolute inset-0 p-3 pl-4 font-mono text-xs leading-6 bg-transparent text-transparent caret-white outline-none resize-none overflow-auto whitespace-pre z-10 selection:bg-indigo-500/30 selection:text-white"
          />

          {/* Cursor Tab Ghost Completion Overlay */}
          {ghostCompletion && ghostCompletion.text && (
            <div className="absolute bottom-4 right-4 z-20 bg-[#161824]/90 backdrop-blur border border-indigo-500/40 rounded-lg p-3 shadow-xl shadow-indigo-950/40 max-w-lg transition-all animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#272b3c]">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span>GRACIAS Tab (Complétion IA)</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                  <kbd className="px-1.5 py-0.5 rounded bg-[#202534] border border-[#2d3347] font-mono text-indigo-300">
                    Tab ⇥
                  </kbd>
                  <span>pour accepter</span>
                </div>
              </div>

              <div className="font-mono text-xs text-zinc-300 bg-[#0d0f15] p-2 rounded border border-[#242838] overflow-x-auto max-h-32 whitespace-pre leading-relaxed text-indigo-200">
                {ghostCompletion.text}
              </div>

              <div className="flex items-center justify-between mt-2 pt-1 text-[11px]">
                <button
                  onClick={onDismissGhostCompletion}
                  className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  Rejeter (Échap)
                </button>
                <button
                  onClick={onAcceptGhostCompletion}
                  className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1 cursor-pointer transition"
                >
                  <span>Insérer</span>
                  <span className="font-mono text-[10px]">Tab</span>
                </button>
              </div>
            </div>
          )}

          {/* Diagnostic Tooltip on Gutter Hover */}
          {hoveredDiagnostic && (
            <div
              style={{ top: Math.max(10, hoveredDiagnostic.y - 40) }}
              className="fixed left-64 z-30 bg-[#171922] border border-rose-500/40 rounded-lg p-2.5 shadow-2xl max-w-md animate-in fade-in"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-rose-300 mb-0.5">
                    Ligne {hoveredDiagnostic.issue.line} : {hoveredDiagnostic.issue.rule}
                  </div>
                  <div className="text-zinc-300 leading-snug">
                    {hoveredDiagnostic.issue.message}
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => onFixDiagnostic(hoveredDiagnostic.issue)}
                      className="px-2 py-1 rounded bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-200 text-[11px] font-medium transition cursor-pointer flex items-center gap-1"
                    >
                      <Wand2 className="w-3 h-3 text-rose-300" />
                      <span>Auto-Fix IA</span>
                    </button>

                    <button
                      onClick={onRunAiDebugger}
                      className="px-2 py-1 rounded bg-[#252936] hover:bg-[#2f3445] text-zinc-300 text-[11px] transition cursor-pointer flex items-center gap-1"
                    >
                      <Bug className="w-3 h-3 text-yellow-400" />
                      <span>Analyser avec Débogueur</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
