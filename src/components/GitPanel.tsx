import React, { useState } from 'react';
import {
  GitBranch,
  GitCommit,
  Check,
  RotateCcw,
  Sparkles,
  Plus,
  Minus,
  FileCode,
  History,
  ChevronDown,
  ChevronRight,
  GitPullRequest,
  CheckCircle2,
  Clock,
  User,
  Eye,
  FileDiff
} from 'lucide-react';
import { CodeFile, GitCommit as GitCommitType, FileGitStatus } from '../types/editor';

interface GitPanelProps {
  files: CodeFile[];
  originalFiles: Map<string, string>;
  gitHistory: GitCommitType[];
  currentBranch: string;
  branches: string[];
  onChangeBranch: (branch: string) => void;
  onCommit: (message: string) => void;
  onDiscardFileChanges: (fileId: string) => void;
  onDiscardAllChanges: () => void;
  onOpenFileDiff: (file: CodeFile) => void;
}

export const GitPanel: React.FC<GitPanelProps> = ({
  files,
  originalFiles,
  gitHistory,
  currentBranch,
  branches,
  onChangeBranch,
  onCommit,
  onDiscardFileChanges,
  onDiscardAllChanges,
  onOpenFileDiff,
}) => {
  const [commitMessage, setCommitMessage] = useState('');
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'changes' | 'history'>('changes');
  const [expandedCommitId, setExpandedCommitId] = useState<string | null>(null);
  const [isNewBranchOpen, setIsNewBranchOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');

  // Identifier les fichiers modifiés par rapport à leur état HEAD
  const modifiedFilesList = files.filter((f) => {
    const orig = originalFiles.get(f.id);
    return orig !== undefined && orig !== f.content;
  });

  const changedFilesCount = modifiedFilesList.length;

  // Séparer les fichiers indexés et non-indexés
  const stagedList = modifiedFilesList.filter((f) => stagedFiles.has(f.id));
  const unstagedList = modifiedFilesList.filter((f) => !stagedFiles.has(f.id));

  // Stage / Unstage individuel
  const toggleStageFile = (fileId: string) => {
    setStagedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  };

  const stageAll = () => {
    setStagedFiles(new Set(modifiedFilesList.map((f) => f.id)));
  };

  const unstageAll = () => {
    setStagedFiles(new Set());
  };

  // Génération automatique du message de commit avec l'IA
  const handleGenerateAiCommitMessage = async () => {
    if (changedFilesCount === 0) return;
    setIsGeneratingMessage(true);

    try {
      const changedFileNames = modifiedFilesList.map((f) => f.name);
      // Récupérer un extrait des modifications
      const diffSummary = modifiedFilesList
        .map((f) => `File ${f.name} modified (${f.content.split('\n').length} lines)`)
        .join('; ');

      const res = await fetch('/api/ai/git-commit-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changedFiles: changedFileNames,
          diffs: diffSummary,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.message) {
          setCommitMessage(data.message);
        }
      }
    } catch {
      setCommitMessage('feat: mise à jour des fichiers du projet');
    } finally {
      setIsGeneratingMessage(false);
    }
  };

  const handleCommitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim() || changedFilesCount === 0) return;
    onCommit(commitMessage.trim());
    setCommitMessage('');
    setStagedFiles(new Set());
  };

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    onChangeBranch(newBranchName.trim().replace(/\s+/g, '-').toLowerCase());
    setNewBranchName('');
    setIsNewBranchOpen(false);
  };

  return (
    <div className="w-56 flex flex-col justify-between h-full bg-[#12141a] text-zinc-300 select-none text-xs">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="h-9 px-3 border-b border-[#232730] flex items-center justify-between text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
          <div className="flex items-center gap-1.5 text-zinc-300">
            <GitPullRequest className="w-3.5 h-3.5 text-indigo-400" />
            <span>Contrôle Git</span>
          </div>

          <div className="flex items-center gap-1 font-sans">
            <button
              onClick={() => setActiveTab('changes')}
              className={`px-1.5 py-0.5 rounded text-[10px] transition cursor-pointer ${
                activeTab === 'changes'
                  ? 'bg-indigo-600/30 text-indigo-300 font-bold border border-indigo-500/40'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Changements ({changedFilesCount})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-1.5 py-0.5 rounded text-[10px] transition cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-indigo-600/30 text-indigo-300 font-bold border border-indigo-500/40'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Historique
            </button>
          </div>
        </div>

        {/* Current Branch Selector Bar */}
        <div className="p-2 border-b border-[#232730] bg-[#0e1016]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-200 truncate">
              <GitBranch className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <select
                value={currentBranch}
                onChange={(e) => {
                  if (e.target.value === '__NEW__') {
                    setIsNewBranchOpen(true);
                  } else {
                    onChangeBranch(e.target.value);
                  }
                }}
                className="bg-transparent text-xs font-mono text-zinc-200 outline-none cursor-pointer pr-1 truncate"
              >
                {branches.map((b) => (
                  <option key={b} value={b} className="bg-[#12141a] text-zinc-200">
                    {b}
                  </option>
                ))}
                <option value="__NEW__" className="bg-[#12141a] text-indigo-300 font-semibold">
                  + Nouvelle branche...
                </option>
              </select>
            </div>

            {changedFilesCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Modifications en attente" />
            )}
          </div>

          {/* Inline Form to create new branch */}
          {isNewBranchOpen && (
            <form onSubmit={handleCreateBranch} className="mt-2 pt-2 border-t border-[#232730]">
              <input
                type="text"
                autoFocus
                placeholder="nom-de-la-branche"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                onBlur={() => {
                  if (!newBranchName.trim()) setIsNewBranchOpen(false);
                }}
                className="w-full bg-[#181a24] border border-indigo-500/50 rounded px-2 py-1 text-xs text-white outline-none font-mono"
              />
            </form>
          )}
        </div>

        {/* TAB 1: CHANGES VIEW */}
        {activeTab === 'changes' && (
          <div className="flex-1 overflow-y-auto p-2 flex flex-col justify-between">
            <div>
              {/* Commit Input Area */}
              <form onSubmit={handleCommitSubmit} className="mb-3">
                <div className="relative">
                  <textarea
                    rows={2}
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="Message de commit..."
                    className="w-full bg-[#181a24] border border-[#2b3040] focus:border-indigo-500 rounded-lg p-2 text-xs text-white placeholder-zinc-500 outline-none font-sans resize-none"
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                        handleCommitSubmit(e);
                      }
                    }}
                  />

                  {/* AI Commit Message Generator Icon Button */}
                  <button
                    type="button"
                    onClick={handleGenerateAiCommitMessage}
                    disabled={isGeneratingMessage || changedFilesCount === 0}
                    className="absolute right-2 bottom-2.5 p-1 rounded hover:bg-purple-600/30 text-purple-400 hover:text-purple-300 transition cursor-pointer disabled:opacity-40"
                    title="Générer un message de commit conventionnel avec l'IA"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingMessage ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!commitMessage.trim() || changedFilesCount === 0}
                  className="w-full mt-1.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Commit vers {currentBranch}</span>
                </button>
              </form>

              {/* Staged Changes Section */}
              {stagedList.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 px-1 mb-1">
                    <span>INDEXÉES ({stagedList.length})</span>
                    <button
                      onClick={unstageAll}
                      className="hover:text-white p-0.5 rounded cursor-pointer"
                      title="Tout désindexer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-0.5">
                    {stagedList.map((file) => (
                      <div
                        key={file.id}
                        className="group flex items-center justify-between px-2 py-1 rounded bg-[#171a24] hover:bg-[#1e2230] text-xs font-mono cursor-pointer transition"
                        onClick={() => onOpenFileDiff(file)}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-[10px] font-bold text-emerald-400 font-mono">M</span>
                          <span className="truncate text-zinc-200">{file.name}</span>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStageFile(file.id);
                            }}
                            className="p-0.5 hover:text-white cursor-pointer"
                            title="Désindexer"
                          >
                            <Minus className="w-3 h-3 text-amber-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Working Changes Section */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 px-1 mb-1">
                  <span>MODIFICATIONS ({unstagedList.length})</span>
                  {unstagedList.length > 0 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={stageAll}
                        className="hover:text-white p-0.5 rounded cursor-pointer"
                        title="Tout indexer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={onDiscardAllChanges}
                        className="hover:text-rose-400 p-0.5 rounded cursor-pointer"
                        title="Tout annuler (Discard all)"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {unstagedList.length === 0 && stagedList.length === 0 ? (
                  <div className="py-6 text-center text-zinc-500 font-sans">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500/70 mx-auto mb-1.5" />
                    <span>Espace de travail propre</span>
                    <p className="text-[10px] text-zinc-600 mt-0.5">
                      Aucune modification non validée
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {unstagedList.map((file) => (
                      <div
                        key={file.id}
                        className="group flex items-center justify-between px-2 py-1 rounded hover:bg-[#1a1d26] text-xs font-mono cursor-pointer transition"
                        onClick={() => onOpenFileDiff(file)}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-[10px] font-bold text-amber-400 font-mono">M</span>
                          <span className="truncate text-zinc-300">{file.name}</span>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenFileDiff(file);
                            }}
                            className="p-0.5 hover:text-white cursor-pointer"
                            title="Voir le Diff"
                          >
                            <FileDiff className="w-3 h-3 text-indigo-400" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStageFile(file.id);
                            }}
                            className="p-0.5 hover:text-white cursor-pointer"
                            title="Indexer"
                          >
                            <Plus className="w-3 h-3 text-emerald-400" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDiscardFileChanges(file.id);
                            }}
                            className="p-0.5 hover:text-rose-400 cursor-pointer"
                            title="Annuler les modifications (Discard)"
                          >
                            <RotateCcw className="w-3 h-3 text-zinc-400 hover:text-rose-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMMIT HISTORY VIEW */}
        {activeTab === 'history' && (
          <div className="flex-1 overflow-y-auto p-2 space-y-2 font-sans">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase px-1">
              Historique des versions ({gitHistory.length})
            </div>

            <div className="space-y-1.5">
              {gitHistory.map((commit) => {
                const isExpanded = expandedCommitId === commit.id;
                return (
                  <div
                    key={commit.id}
                    onClick={() => setExpandedCommitId(isExpanded ? null : commit.id)}
                    className="p-2 rounded-lg bg-[#161822] border border-[#232734] hover:border-[#303649] transition cursor-pointer text-xs"
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="font-semibold text-zinc-200 line-clamp-2">
                        {commit.message}
                      </span>
                      <span className="text-[10px] px-1 rounded bg-[#202534] text-indigo-300 font-mono shrink-0">
                        {commit.hash}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-zinc-600" />
                        <span>{commit.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-600" />
                        <span>{commit.date}</span>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-[#242938] text-[11px] text-zinc-400 space-y-1 font-mono">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                          Fichiers modifiés :
                        </span>
                        {commit.files.map((f, i) => (
                          <div key={i} className="flex items-center gap-1 text-zinc-300">
                            <FileCode className="w-3 h-3 text-indigo-400" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-[#232730] bg-[#0e1016] text-[10px] text-zinc-500 font-mono flex items-center justify-between">
        <span>Git Engine • Local Tree</span>
        <span className="text-emerald-400 font-semibold">Synchronisé</span>
      </div>
    </div>
  );
};
