import React, { useMemo } from 'react';
import { X, GitCommit, Check, RotateCcw, ArrowLeft, FileCode } from 'lucide-react';
import { SupportedLanguage } from '../types/editor';

interface DiffViewerProps {
  fileName: string;
  originalContent: string;
  currentContent: string;
  language: SupportedLanguage;
  branchName: string;
  onClose: () => void;
  onDiscardChanges: () => void;
  onStageFile?: () => void;
  isStaged?: boolean;
}

interface DiffLine {
  type: 'same' | 'added' | 'removed' | 'empty';
  leftLineNum?: number;
  rightLineNum?: number;
  leftText?: string;
  rightText?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  fileName,
  originalContent,
  currentContent,
  branchName,
  onClose,
  onDiscardChanges,
  onStageFile,
  isStaged,
}) => {
  // Calcul de base du diff ligne par ligne
  const { diffLines, addedCount, removedCount } = useMemo(() => {
    const origLines = (originalContent || '').split('\n');
    const currLines = (currentContent || '').split('\n');
    const result: DiffLine[] = [];
    let added = 0;
    let removed = 0;

    const maxLen = Math.max(origLines.length, currLines.length);

    // Comparaison simple alignée par ligne
    let oIdx = 0;
    let cIdx = 0;

    while (oIdx < origLines.length || cIdx < currLines.length) {
      const oLine = origLines[oIdx];
      const cLine = currLines[cIdx];

      if (oLine === cLine) {
        result.push({
          type: 'same',
          leftLineNum: oIdx + 1,
          rightLineNum: cIdx + 1,
          leftText: oLine,
          rightText: cLine,
        });
        oIdx++;
        cIdx++;
      } else if (oLine !== undefined && cLine !== undefined) {
        // Changement sur la ligne
        result.push({
          type: 'removed',
          leftLineNum: oIdx + 1,
          rightLineNum: undefined,
          leftText: oLine,
          rightText: '',
        });
        removed++;
        result.push({
          type: 'added',
          leftLineNum: undefined,
          rightLineNum: cIdx + 1,
          leftText: '',
          rightText: cLine,
        });
        added++;
        oIdx++;
        cIdx++;
      } else if (oLine !== undefined) {
        result.push({
          type: 'removed',
          leftLineNum: oIdx + 1,
          leftText: oLine,
        });
        removed++;
        oIdx++;
      } else if (cLine !== undefined) {
        result.push({
          type: 'added',
          rightLineNum: cIdx + 1,
          rightText: cLine,
        });
        added++;
        cIdx++;
      }
    }

    return { diffLines: result, addedCount: added, removedCount: removed };
  }, [originalContent, currentContent]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d0e12] overflow-hidden select-none font-mono">
      {/* Top Bar Diff Info */}
      <div className="h-10 bg-[#12141c] border-b border-[#232730] px-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-[#1f222e] transition cursor-pointer"
            title="Revenir à l'éditeur standard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <FileCode className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-white">{fileName}</span>
          <span className="text-[11px] text-zinc-500 font-sans">
            (HEAD : {branchName} ↔ Espace de travail)
          </span>

          <div className="flex items-center gap-1.5 ml-2 font-mono text-[11px]">
            <span className="px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              +{addedCount}
            </span>
            <span className="px-1.5 py-0.2 rounded bg-rose-950/60 text-rose-400 border border-rose-800/40">
              -{removedCount}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 font-sans">
          {onStageFile && (
            <button
              onClick={onStageFile}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition cursor-pointer border ${
                isStaged
                  ? 'bg-amber-950/40 text-amber-300 border-amber-800/50 hover:bg-amber-950/60'
                  : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50 hover:bg-emerald-950/60'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isStaged ? 'Désindexer' : 'Indexer (Stage)'}</span>
            </button>
          )}

          <button
            onClick={onDiscardChanges}
            className="px-2.5 py-1 rounded text-xs font-medium bg-[#1e222e] hover:bg-[#282d3e] text-zinc-300 hover:text-rose-300 border border-[#2b3040] flex items-center gap-1 transition cursor-pointer"
            title="Annuler toutes les modifications locales de ce fichier"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurer (Discard)</span>
          </button>

          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-[#1f222e] cursor-pointer"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Side-by-side Diff Canvas */}
      <div className="flex-1 overflow-auto bg-[#0b0c10] text-xs">
        <div className="min-w-full">
          {diffLines.map((line, idx) => {
            let rowBg = '';
            let indicator = ' ';
            let textClass = 'text-zinc-300';

            if (line.type === 'added') {
              rowBg = 'bg-emerald-950/30 border-l-2 border-emerald-500';
              indicator = '+';
              textClass = 'text-emerald-300';
            } else if (line.type === 'removed') {
              rowBg = 'bg-rose-950/30 border-l-2 border-rose-500';
              indicator = '-';
              textClass = 'text-rose-300 line-through opacity-80';
            }

            return (
              <div
                key={idx}
                className={`flex items-center h-6 leading-6 hover:bg-[#161922] transition ${rowBg}`}
              >
                {/* Left Line Number */}
                <div className="w-12 text-right pr-3 text-zinc-600 select-none text-[11px] font-mono shrink-0">
                  {line.leftLineNum || ''}
                </div>

                {/* Right Line Number */}
                <div className="w-12 text-right pr-3 text-zinc-600 select-none text-[11px] font-mono shrink-0 border-r border-[#1e222e]">
                  {line.rightLineNum || ''}
                </div>

                {/* Diff Indicator */}
                <div className="w-6 text-center select-none font-bold shrink-0">
                  <span
                    className={
                      indicator === '+'
                        ? 'text-emerald-400'
                        : indicator === '-'
                        ? 'text-rose-400'
                        : 'text-transparent'
                    }
                  >
                    {indicator}
                  </span>
                </div>

                {/* Line Code */}
                <div className={`flex-1 pl-2 font-mono whitespace-pre truncate ${textClass}`}>
                  {line.type === 'removed' ? line.leftText : line.rightText || line.leftText || ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
