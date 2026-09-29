import React, { useState } from 'react';
import {
  Files,
  Bug,
  MessageSquareCode,
  Terminal,
  Plus,
  Trash2,
  FileCode,
  FileJson,
  ChevronRight,
  ChevronDown,
  Sparkles,
  AlertCircle,
  GitPullRequest,
  TestTube2
} from 'lucide-react';
import {
  CodeFile,
  DiagnosticIssue,
  SupportedLanguage,
  GitCommit,
  TestSuite
} from '../types/editor';
import { GitPanel } from './GitPanel';
import { TestsPanel } from './TestsPanel';

interface SidebarProps {
  files: CodeFile[];
  originalFiles: Map<string, string>;
  currentFile: CodeFile;
  onSelectFile: (file: CodeFile) => void;
  onAddFile: (name: string, language: SupportedLanguage) => void;
  onDeleteFile: (id: string) => void;
  diagnostics: DiagnosticIssue[];
  activeView: 'explorer' | 'git' | 'tests' | 'debugger' | 'composer' | 'terminal';
  onChangeView: (view: 'explorer' | 'git' | 'tests' | 'debugger' | 'composer' | 'terminal') => void;
  gitHistory: GitCommit[];
  currentBranch: string;
  branches: string[];
  onChangeBranch: (branch: string) => void;
  onCommit: (message: string) => void;
  onDiscardFileChanges: (fileId: string) => void;
  onDiscardAllChanges: () => void;
  onOpenFileDiff: (file: CodeFile) => void;
  // Props de tests
  testSuite: TestSuite;
  isRunningTests: boolean;
  onRunAllTests: () => void;
  onGenerateAiTests: () => void;
  isGeneratingAiTests: boolean;
  onAutoFixTestError?: (errorMessage: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  files,
  originalFiles,
  currentFile,
  onSelectFile,
  onAddFile,
  onDeleteFile,
  diagnostics,
  activeView,
  onChangeView,
  gitHistory,
  currentBranch,
  branches,
  onChangeBranch,
  onCommit,
  onDiscardFileChanges,
  onDiscardAllChanges,
  onOpenFileDiff,
  testSuite,
  isRunningTests,
  onRunAllTests,
  onGenerateAiTests,
  isGeneratingAiTests,
  onAutoFixTestError,
}) => {
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [isProjectExpanded, setIsProjectExpanded] = useState(true);

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    let lang: SupportedLanguage = 'javascript';
    if (newFileName.endsWith('.ts') || newFileName.endsWith('.tsx')) lang = 'typescript';
    else if (newFileName.endsWith('.py')) lang = 'python';
    else if (newFileName.endsWith('.json')) lang = 'json';
    else if (newFileName.endsWith('.html')) lang = 'html';
    else if (newFileName.endsWith('.css')) lang = 'css';

    onAddFile(newFileName.trim(), lang);
    setNewFileName('');
    setIsAddingFile(false);
  };

  const getFileIcon = (file: CodeFile) => {
    if (file.language === 'typescript') {
      return <span className="text-[10px] font-bold text-sky-400 bg-sky-950/60 px-1 py-0.5 rounded border border-sky-800/40">TS</span>;
    }
    if (file.language === 'javascript') {
      return <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 px-1 py-0.5 rounded border border-amber-800/40">JS</span>;
    }
    if (file.language === 'python') {
      return <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-800/40">PY</span>;
    }
    if (file.language === 'json') {
      return <FileJson className="w-3.5 h-3.5 text-yellow-500" />;
    }
    return <FileCode className="w-3.5 h-3.5 text-zinc-400" />;
  };

  const errorCount = diagnostics.filter((d) => d.severity === 'error').length;

  // Calcul du nombre de fichiers modifiés
  const modifiedCount = files.filter((f) => {
    const orig = originalFiles.get(f.id);
    return orig !== undefined && orig !== f.content;
  }).length;

  // Tests en échec
  const failedTestCount = testSuite.tests.filter((t) => t.status === 'failed').length;

  return (
    <div className="flex h-full border-r border-[#232730] bg-[#12141a] select-none">
      {/* Activity Bar (Left strip) */}
      <div className="w-12 border-r border-[#232730] bg-[#0d0e12] flex flex-col items-center py-2.5 gap-2">
        {/* Explorer icon */}
        <button
          onClick={() => onChangeView('explorer')}
          className={`p-2.5 rounded-lg transition relative cursor-pointer ${
            activeView === 'explorer'
              ? 'bg-[#1e222b] text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#161820]'
          }`}
          title="Explorateur de Fichiers (Cmd+Shift+E)"
        >
          <Files className="w-4 h-4" />
          {activeView === 'explorer' && (
            <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-indigo-500 rounded-r" />
          )}
        </button>

        {/* Source Control / Git icon */}
        <button
          onClick={() => onChangeView('git')}
          className={`p-2.5 rounded-lg transition relative cursor-pointer ${
            activeView === 'git'
              ? 'bg-[#1e222b] text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#161820]'
          }`}
          title="Contrôle de Version (Git) (Cmd+Shift+G)"
        >
          <GitPullRequest className="w-4 h-4" />
          {modifiedCount > 0 && (
            <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-indigo-600 text-[9px] font-bold text-white flex items-center justify-center font-mono ring-2 ring-[#0d0e12]">
              {modifiedCount}
            </span>
          )}
          {activeView === 'git' && (
            <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-indigo-500 rounded-r" />
          )}
        </button>

        {/* Unit Tests icon */}
        <button
          onClick={() => onChangeView('tests')}
          className={`p-2.5 rounded-lg transition relative cursor-pointer ${
            activeView === 'tests'
              ? 'bg-[#1e222b] text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#161820]'
          }`}
          title="Tests Unitaires (Vitest / Jest) (Cmd+Shift+T)"
        >
          <TestTube2 className="w-4 h-4" />
          {failedTestCount > 0 && (
            <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center font-mono ring-2 ring-[#0d0e12]">
              {failedTestCount}
            </span>
          )}
          {activeView === 'tests' && (
            <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-indigo-500 rounded-r" />
          )}
        </button>

        {/* Debugger icon */}
        <button
          onClick={() => onChangeView('debugger')}
          className={`p-2.5 rounded-lg transition relative cursor-pointer ${
            activeView === 'debugger'
              ? 'bg-[#1e222b] text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#161820]'
          }`}
          title="Débogueur & Diagnostics IA (Cmd+Shift+D)"
        >
          <Bug className="w-4 h-4" />
          {errorCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0d0e12]" />
          )}
          {activeView === 'debugger' && (
            <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-indigo-500 rounded-r" />
          )}
        </button>

        {/* Composer icon */}
        <button
          onClick={() => onChangeView('composer')}
          className={`p-2.5 rounded-lg transition relative cursor-pointer ${
            activeView === 'composer'
              ? 'bg-[#1e222b] text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#161820]'
          }`}
          title="GRACIAS Composer (Cmd+I)"
        >
          <MessageSquareCode className="w-4 h-4" />
          {activeView === 'composer' && (
            <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-indigo-500 rounded-r" />
          )}
        </button>

        {/* Terminal icon */}
        <button
          onClick={() => onChangeView('terminal')}
          className={`p-2.5 rounded-lg transition relative cursor-pointer ${
            activeView === 'terminal'
              ? 'bg-[#1e222b] text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#161820]'
          }`}
          title="Console & Sortie d'exécution"
        >
          <Terminal className="w-4 h-4" />
          {activeView === 'terminal' && (
            <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-indigo-500 rounded-r" />
          )}
        </button>
      </div>

      {/* Drawer Pane: EITHER GIT, TESTS, OR FILE EXPLORER */}
      {activeView === 'git' ? (
        <GitPanel
          files={files}
          originalFiles={originalFiles}
          gitHistory={gitHistory}
          currentBranch={currentBranch}
          branches={branches}
          onChangeBranch={onChangeBranch}
          onCommit={onCommit}
          onDiscardFileChanges={onDiscardFileChanges}
          onDiscardAllChanges={onDiscardAllChanges}
          onOpenFileDiff={onOpenFileDiff}
        />
      ) : activeView === 'tests' ? (
        <TestsPanel
          currentFile={currentFile}
          testSuite={testSuite}
          isRunningTests={isRunningTests}
          onRunAllTests={onRunAllTests}
          onGenerateAiTests={onGenerateAiTests}
          isGeneratingAiTests={isGeneratingAiTests}
          onAutoFixTestError={onAutoFixTestError}
        />
      ) : (
        <div className="w-56 flex flex-col justify-between h-full bg-[#12141a]">
          <div>
            {/* Header */}
            <div className="h-9 px-3 border-b border-[#232730] flex items-center justify-between text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
              <span>Explorateur</span>
              <button
                onClick={() => setIsAddingFile(true)}
                className="p-1 rounded hover:bg-[#20242e] text-zinc-400 hover:text-white transition cursor-pointer"
                title="Créer un nouveau fichier"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Project Tree Section */}
            <div className="p-1">
              <div
                onClick={() => setIsProjectExpanded(!isProjectExpanded)}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-zinc-300 hover:bg-[#1a1d24] cursor-pointer"
              >
                {isProjectExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                )}
                <span className="font-semibold text-zinc-300 text-[11px] uppercase tracking-wider">
                  Workspace
                </span>
              </div>

              {isProjectExpanded && (
                <div className="mt-0.5 space-y-0.5 pl-2">
                  {/* Form to add a file */}
                  {isAddingFile && (
                    <form onSubmit={handleCreateFile} className="px-2 py-1">
                      <input
                        type="text"
                        autoFocus
                        placeholder="nom.ts / script.py"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        onBlur={() => {
                          if (!newFileName.trim()) setIsAddingFile(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setIsAddingFile(false);
                        }}
                        className="w-full bg-[#1a1e28] border border-indigo-500/50 rounded px-2 py-1 text-xs text-white outline-none font-mono"
                      />
                    </form>
                  )}

                  {/* File list */}
                  {files.map((file) => {
                    const isActive = currentFile.id === file.id;
                    const fileHasErrors = isActive && errorCount > 0;
                    const isFileModified = originalFiles.get(file.id) !== file.content;

                    return (
                      <div
                        key={file.id}
                        onClick={() => onSelectFile(file)}
                        className={`group flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-mono transition cursor-pointer ${
                          isActive
                            ? 'bg-[#222633] text-white font-medium border-l-2 border-indigo-500 pl-2'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#181a22]'
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden truncate">
                          {getFileIcon(file)}
                          <span className="truncate">{file.name}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {fileHasErrors && (
                            <span title={`${errorCount} problème(s) détecté(s)`}>
                              <AlertCircle className="w-3 h-3 text-rose-400" />
                            </span>
                          )}
                          {isFileModified && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Modifié (Git)" />
                          )}
                          {files.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteFile(file.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 rounded transition cursor-pointer"
                              title="Supprimer ce fichier"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Workspace Footer: AI Engine Status */}
          <div className="p-3 border-t border-[#232730] bg-[#0f1116] text-[11px] text-zinc-400">
            <div className="flex items-center gap-1.5 text-zinc-300 font-medium mb-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Moteur d'IA Actif</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">
              Gemini 3.8 Flash • GRACIAS Tab • Vitest Test Runner
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
