import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Check, X, ArrowRight, Loader2, Wand2 } from 'lucide-react';
import { InlineEditState } from '../types/editor';

interface InlineEditWidgetProps {
  state: InlineEditState;
  onClose: () => void;
  onSubmit: (prompt: string) => void;
  onAccept: () => void;
  onReject: () => void;
}

export const InlineEditWidget: React.FC<InlineEditWidgetProps> = ({
  state,
  onClose,
  onSubmit,
  onAccept,
  onReject,
}) => {
  const [prompt, setPrompt] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [state.isOpen]);

  if (!state.isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || state.isLoading) return;
    onSubmit(prompt.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onReject();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      if (state.proposedCode) {
        onAccept();
      } else if (prompt.trim()) {
        onSubmit(prompt.trim());
      }
    }
  };

  const QUICK_PROMPTS = [
    'Corriger les bugs de cette sélection',
    'Optimiser et simplifier',
    'Ajouter vérification et gestion d’erreurs',
    'Typer avec TypeScript strict',
  ];

  return (
    <div
      className="absolute top-12 left-16 right-16 z-30 bg-[#161822]/95 backdrop-blur-md border border-purple-500/40 rounded-xl shadow-2xl shadow-purple-950/40 p-3 max-w-3xl mx-auto transition-all animate-in fade-in zoom-in-95 duration-150"
      onKeyDown={handleKeyDown}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2a2e3d]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-purple-400" />
          </div>
          <span className="text-xs font-semibold text-white tracking-wide">
            GRACIAS Inline Edit (Cmd+K)
          </span>
          <span className="text-[10px] bg-[#232736] px-1.5 py-0.5 rounded text-zinc-400 font-mono">
            Lignes {state.startLine} à {state.endLine}
          </span>
        </div>

        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white p-1 rounded hover:bg-[#252a3a] transition cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Instruction pour l'IA (ex: corriger le bug asynchrone, gérer les erreurs, optimiser)..."
            className="w-full bg-[#0d0f14] border border-[#303649] focus:border-purple-500 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none font-sans"
            disabled={state.isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={!prompt.trim() || state.isLoading}
          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
        >
          {state.isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Génération...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-3.5 h-3.5" />
              <span>Générer</span>
            </>
          )}
        </button>
      </form>

      {/* Quick Suggestions Chips */}
      {!state.proposedCode && !state.isLoading && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {QUICK_PROMPTS.map((quick, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setPrompt(quick);
                onSubmit(quick);
              }}
              className="text-[11px] px-2 py-0.5 rounded-md bg-[#1e2230] text-zinc-300 hover:text-white hover:bg-[#262c3e] border border-[#2e3549] transition cursor-pointer flex items-center gap-1"
            >
              <span>{quick}</span>
              <ArrowRight className="w-2.5 h-2.5 text-zinc-500" />
            </button>
          ))}
        </div>
      )}

      {/* Diff Preview when Code is Proposed */}
      {state.proposedCode && (
        <div className="mt-3 pt-3 border-t border-[#2a2e3d]">
          {state.explanation && (
            <div className="mb-2 p-2 rounded bg-purple-950/30 border border-purple-800/30 text-xs text-purple-200">
              <span className="font-semibold">Explication : </span>
              {state.explanation}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
            {/* Original */}
            <div className="rounded-lg bg-[#11131a] border border-rose-900/30 p-2.5 overflow-x-auto max-h-48">
              <div className="text-[10px] uppercase font-bold text-rose-400 mb-1">Original</div>
              <pre className="text-rose-300/80 whitespace-pre-wrap leading-relaxed">
                {state.selectedText || '// Code vide'}
              </pre>
            </div>

            {/* Proposed */}
            <div className="rounded-lg bg-[#11131a] border border-emerald-900/30 p-2.5 overflow-x-auto max-h-48">
              <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1">
                Proposition IA
              </div>
              <pre className="text-emerald-300 whitespace-pre-wrap leading-relaxed">
                {state.proposedCode}
              </pre>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 mt-3">
            <button
              onClick={onReject}
              className="px-3 py-1.5 rounded-md bg-[#222634] hover:bg-[#2b3042] text-xs text-zinc-300 transition flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Rejeter (Échap)</span>
            </button>

            <button
              onClick={onAccept}
              className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-medium transition flex items-center gap-1.5 shadow-md shadow-emerald-900/30 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Accepter les changements (Cmd+Enter)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
