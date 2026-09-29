import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CodeEditor } from './components/CodeEditor';
import { DiffViewer } from './components/DiffViewer';
import { InlineEditWidget } from './components/InlineEditWidget';
import { BottomPanel } from './components/BottomPanel';
import { AiChatPanel } from './components/AiChatPanel';
import { ShortcutsModal } from './components/ShortcutsModal';
import { INITIAL_FILES } from './constants/initialProjects';
import {
  CodeFile,
  DiagnosticIssue,
  Breakpoint,
  ConsoleEntry,
  GhostCompletion,
  InlineEditState,
  AiDebugResult,
  SupportedLanguage,
  GitCommit,
  TestSuite,
} from './types/editor';
import { analyzeCode } from './utils/analyzer';
import { runCodeSandboxed } from './utils/runner';
import { getDefaultTestSuite, runTestSuite } from './utils/testRunner';

// Historique de commits initial réaliste
const INITIAL_COMMITS: GitCommit[] = [
  {
    id: 'commit-2',
    hash: 'e8d249f',
    message: 'feat(core): initialiser le projet GRACIAS AI Studio avec debogueur temps réel',
    author: 'GRACIAS Developer',
    date: 'Aujourd\'hui à 11:42',
    files: ['checkoutService.ts', 'cacheManager.js', 'appConfig.json'],
  },
  {
    id: 'commit-1',
    hash: '9a1f3c2',
    message: 'chore: configuration initiale du workspace et algorithmes',
    author: 'GRACIAS Developer',
    date: 'Hier à 17:15',
    files: ['algorithms.py', 'appConfig.json'],
  },
];

export default function App() {
  const [files, setFiles] = useState<CodeFile[]>(INITIAL_FILES);
  const [currentFileId, setCurrentFileId] = useState<string>(INITIAL_FILES[0].id);
  const [openFileIds, setOpenFileIds] = useState<string[]>([INITIAL_FILES[0].id, INITIAL_FILES[1].id]);

  // Référence Git HEAD des fichiers
  const [originalFiles, setOriginalFiles] = useState<Map<string, string>>(() => {
    const map = new Map<string, string>();
    for (const f of INITIAL_FILES) {
      map.set(f.id, f.content);
    }
    return map;
  });

  // Branches & Historique Git
  const [currentBranch, setCurrentBranch] = useState('main');
  const [branches, setBranches] = useState(['main', 'feat/checkout-flow', 'fix/async-tax']);
  const [gitHistory, setGitHistory] = useState<GitCommit[]>(INITIAL_COMMITS);
  const [diffFile, setDiffFile] = useState<CodeFile | null>(null);

  const currentFile = files.find((f) => f.id === currentFileId) || files[0];
  const openFiles = files.filter((f) => openFileIds.includes(f.id));

  // Diagnostics statiques calculés en temps réel
  const [diagnostics, setDiagnostics] = useState<DiagnosticIssue[]>([]);

  // Logs d'exécution & console
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Points d'arrêt
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([]);

  // Complétion GRACIAS Tab
  const [isTabCompletionEnabled, setIsTabCompletionEnabled] = useState(true);
  const [ghostCompletion, setGhostCompletion] = useState<GhostCompletion | null>(null);
  const completionDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Inline Edit Cmd+K
  const [inlineEditState, setInlineEditState] = useState<InlineEditState>({
    isOpen: false,
    startLine: 1,
    endLine: 1,
    selectedText: '',
    prompt: '',
    isLoading: false,
  });

  // Débogueur IA Approfondi
  const [aiDebugResult, setAiDebugResult] = useState<AiDebugResult | null>(null);
  const [isAiDebugging, setIsAiDebugging] = useState(false);

  // Panneaux et vues
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [activeSidebarView, setActiveSidebarView] = useState<'explorer' | 'git' | 'tests' | 'debugger' | 'composer' | 'terminal'>('explorer');
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // État des Tests Unitaires (Vitest / Jest)
  const [testSuite, setTestSuite] = useState<TestSuite>(() => getDefaultTestSuite(INITIAL_FILES[0]));
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [isGeneratingAiTests, setIsGeneratingAiTests] = useState(false);

  // Mettre à jour la suite de tests par défaut lors d'un changement de fichier actif
  useEffect(() => {
    if (currentFile) {
      setTestSuite(getDefaultTestSuite(currentFile));
    }
  }, [currentFile.id]);

  // Nombre de fichiers modifiés par rapport au HEAD
  const modifiedFilesCount = files.filter((f) => {
    const orig = originalFiles.get(f.id);
    return orig !== undefined && orig !== f.content;
  }).length;

  // 1. Analyse statique en temps réel (Linter & Diagnostic Engine)
  useEffect(() => {
    if (!currentFile) return;
    const detectedIssues = analyzeCode(currentFile.content, currentFile.language);
    setDiagnostics(detectedIssues);
  }, [currentFile.content, currentFile.language]);

  // 2. Mise à jour du code du fichier
  const handleCodeChange = useCallback((newCode: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === currentFileId ? { ...f, content: newCode, isModified: true } : f))
    );

    // Déclencher la suggestion GRACIAS Tab après un délai de frappe
    if (isTabCompletionEnabled) {
      if (completionDebounceRef.current) clearTimeout(completionDebounceRef.current);
      setGhostCompletion(null);

      completionDebounceRef.current = setTimeout(async () => {
        try {
          const lines = newCode.split('\n');
          const prefix = lines.slice(-25).join('\n');

          const res = await fetch('/api/ai/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prefix,
              suffix: '',
              fileName: currentFile.name,
              language: currentFile.language,
            }),
          });

          if (!res.ok) return;
          const data = await res.json();
          if (data?.completion && data.completion.trim().length > 0) {
            setGhostCompletion({
              text: data.completion,
              prefix,
              line: lines.length,
              column: 1,
              timestamp: Date.now(),
            });
          }
        } catch {
          // ignorer les erreurs de complétion silencieuses
        }
      }, 500);
    }
  }, [currentFileId, currentFile.name, currentFile.language, isTabCompletionEnabled]);

  // 3. Accepter la complétion GRACIAS Tab
  const handleAcceptGhostCompletion = useCallback(() => {
    if (!ghostCompletion || !ghostCompletion.text) return;
    const newContent = currentFile.content + (currentFile.content.endsWith('\n') ? '' : '\n') + ghostCompletion.text;
    handleCodeChange(newContent);
    setGhostCompletion(null);
  }, [ghostCompletion, currentFile.content, handleCodeChange]);

  const handleDismissGhostCompletion = useCallback(() => {
    setGhostCompletion(null);
  }, []);

  // 4. Exécuter le code dans le bac à sable
  const handleRunCode = useCallback(async () => {
    setIsRunning(true);
    setIsBottomPanelOpen(true);
    try {
      const result = await runCodeSandboxed(currentFile.content, currentFile.language);
      setConsoleEntries((prev) => [...prev, ...result.entries]);
    } catch (err: any) {
      setConsoleEntries((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          type: 'error',
          message: err?.message || 'Erreur inconnue lors du lancement',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  }, [currentFile.content, currentFile.language]);

  // 5. Débogueur IA Approfondi en Temps Réel
  const handleRunAiDebugger = useCallback(async () => {
    setIsAiDebugging(true);
    setIsBottomPanelOpen(true);

    try {
      const recentErrors = consoleEntries.filter((e) => e.type === 'error').slice(-5);
      const res = await fetch('/api/ai/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: currentFile.content,
          fileName: currentFile.name,
          language: currentFile.language,
          errors: diagnostics,
          consoleLogs: recentErrors,
        }),
      });

      if (!res.ok) throw new Error('Erreur de communication avec le Débogueur IA');
      const data: AiDebugResult = await res.json();
      setAiDebugResult(data);
    } catch (err: any) {
      setConsoleEntries((prev) => [
        ...prev,
        {
          id: `dbg-err-${Date.now()}`,
          type: 'error',
          message: `Échec du Débogueur IA: ${err?.message || err}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsAiDebugging(false);
    }
  }, [currentFile.content, currentFile.name, currentFile.language, diagnostics, consoleEntries]);

  // 6. Appliquer la correction du Débogueur IA
  const handleApplyAiDebugFix = useCallback((fixedCode: string) => {
    handleCodeChange(fixedCode);
    setAiDebugResult(null);
    setConsoleEntries((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        type: 'system',
        message: `✨ Correctif IA appliqué avec succès à '${currentFile.name}'. Diagnostic mis à jour.`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  }, [handleCodeChange, currentFile.name]);

  // 7. Auto-Fix direct d'un diagnostic unique
  const handleFixDiagnostic = useCallback(async (diagnostic: DiagnosticIssue) => {
    if (diagnostic.fixPreview) {
      const lines = currentFile.content.split('\n');
      if (diagnostic.line <= lines.length) {
        lines[diagnostic.line - 1] = diagnostic.fixPreview;
        handleCodeChange(lines.join('\n'));
        return;
      }
    }

    try {
      const lines = currentFile.content.split('\n');
      const lineText = lines[diagnostic.line - 1] || '';
      const res = await fetch('/api/ai/inline-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: `Corrige cette erreur : ${diagnostic.message} (Règle : ${diagnostic.rule})`,
          selectedCode: lineText,
          fullFileContext: currentFile.content,
          fileName: currentFile.name,
          language: currentFile.language,
        }),
      });

      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      if (data?.modifiedCode) {
        lines[diagnostic.line - 1] = data.modifiedCode;
        handleCodeChange(lines.join('\n'));
      }
    } catch {
      handleRunAiDebugger();
    }
  }, [currentFile.content, currentFile.name, currentFile.language, handleCodeChange, handleRunAiDebugger]);

  // 8. Déclenchement de l'Inline Edit Cmd+K
  const handleTriggerInlineEdit = useCallback((startLine: number, endLine: number, selectedText: string) => {
    setInlineEditState({
      isOpen: true,
      startLine,
      endLine,
      selectedText,
      prompt: '',
      isLoading: false,
    });
  }, []);

  const handleSubmitInlineEdit = useCallback(async (prompt: string) => {
    setInlineEditState((prev) => ({ ...prev, isLoading: true, prompt }));

    try {
      const res = await fetch('/api/ai/inline-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: prompt,
          selectedCode: inlineEditState.selectedText,
          fullFileContext: currentFile.content,
          fileName: currentFile.name,
          language: currentFile.language,
        }),
      });

      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setInlineEditState((prev) => ({
        ...prev,
        isLoading: false,
        proposedCode: data.modifiedCode,
        explanation: data.explanation,
      }));
    } catch (err: any) {
      setInlineEditState((prev) => ({
        ...prev,
        isLoading: false,
        error: err?.message || 'Erreur lors de la génération',
      }));
    }
  }, [inlineEditState.selectedText, currentFile.content, currentFile.name, currentFile.language]);

  const handleAcceptInlineEdit = useCallback(() => {
    if (!inlineEditState.proposedCode) return;
    const lines = currentFile.content.split('\n');
    const startIdx = Math.max(0, inlineEditState.startLine - 1);
    const deleteCount = Math.max(1, inlineEditState.endLine - inlineEditState.startLine + 1);

    lines.splice(startIdx, deleteCount, inlineEditState.proposedCode);
    handleCodeChange(lines.join('\n'));

    setInlineEditState({
      isOpen: false,
      startLine: 1,
      endLine: 1,
      selectedText: '',
      prompt: '',
      isLoading: false,
    });
  }, [inlineEditState, currentFile.content, handleCodeChange]);

  const handleRejectInlineEdit = useCallback(() => {
    setInlineEditState({
      isOpen: false,
      startLine: 1,
      endLine: 1,
      selectedText: '',
      prompt: '',
      isLoading: false,
    });
  }, []);

  // 9. Gestion des points d'arrêt
  const handleToggleBreakpoint = useCallback((line: number) => {
    setBreakpoints((prev) => {
      const exists = prev.find((b) => b.line === line);
      if (exists) {
        return prev.filter((b) => b.line !== line);
      }
      return [...prev, { line, enabled: true }];
    });
  }, []);

  // 10. Gestion des fichiers
  const handleSelectFile = useCallback((file: CodeFile) => {
    setCurrentFileId(file.id);
    if (!openFileIds.includes(file.id)) {
      setOpenFileIds((prev) => [...prev, file.id]);
    }
    setGhostCompletion(null);
    setDiffFile(null);
  }, [openFileIds]);

  const handleCloseFile = useCallback((fileId: string) => {
    const nextOpen = openFileIds.filter((id) => id !== fileId);
    setOpenFileIds(nextOpen);
    if (currentFileId === fileId && nextOpen.length > 0) {
      setCurrentFileId(nextOpen[0]);
    }
    if (diffFile?.id === fileId) {
      setDiffFile(null);
    }
  }, [currentFileId, openFileIds, diffFile]);

  const handleAddFile = useCallback((name: string, language: SupportedLanguage) => {
    const newFile: CodeFile = {
      id: `file-${Date.now()}`,
      name,
      language,
      content: language === 'python' ? '# Nouveau script Python\nprint("Hello from GRACIAS AI Studio!")\n' : '// Nouveau fichier\n',
    };
    setFiles((prev) => [...prev, newFile]);
    setOpenFileIds((prev) => [...prev, newFile.id]);
    setCurrentFileId(newFile.id);
    // Enregistrer comme nouveau fichier dans la référence Git
    setOriginalFiles((prev) => new Map(prev).set(newFile.id, newFile.content));
  }, []);

  const handleDeleteFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setOpenFileIds((prev) => prev.filter((fId) => fId !== id));
    if (currentFileId === id) {
      const remaining = files.filter((f) => f.id !== id);
      if (remaining.length > 0) {
        setCurrentFileId(remaining[0].id);
      }
    }
    if (diffFile?.id === id) {
      setDiffFile(null);
    }
  }, [currentFileId, files, diffFile]);

  const handleResetWorkspace = useCallback(() => {
    setFiles(INITIAL_FILES);
    setCurrentFileId(INITIAL_FILES[0].id);
    setOpenFileIds([INITIAL_FILES[0].id, INITIAL_FILES[1].id]);
    const baseMap = new Map<string, string>();
    for (const f of INITIAL_FILES) baseMap.set(f.id, f.content);
    setOriginalFiles(baseMap);
    setConsoleEntries([]);
    setAiDebugResult(null);
    setBreakpoints([]);
    setDiffFile(null);
  }, []);

  // 11. Fonctionnalités GIT (Commit, Discard, Branch)
  const handleCommit = useCallback((message: string) => {
    const modifiedFiles = files.filter((f) => {
      const orig = originalFiles.get(f.id);
      return orig !== undefined && orig !== f.content;
    });

    if (modifiedFiles.length === 0) return;

    const hash = Math.random().toString(36).substring(2, 9);
    const newCommit: GitCommit = {
      id: `commit-${Date.now()}`,
      hash,
      message,
      author: 'GRACIAS Developer',
      date: 'À l\'instant',
      files: modifiedFiles.map((f) => f.name),
    };

    setGitHistory((prev) => [newCommit, ...prev]);

    // Mettre à jour la base HEAD avec le nouveau contenu
    setOriginalFiles((prev) => {
      const next = new Map(prev);
      for (const f of modifiedFiles) {
        next.set(f.id, f.content);
      }
      return next;
    });

    setFiles((prev) =>
      prev.map((f) => ({
        ...f,
        isModified: false,
      }))
    );

    setConsoleEntries((prev) => [
      ...prev,
      {
        id: `git-${Date.now()}`,
        type: 'system',
        message: `📦 [${currentBranch} ${hash}] ${message} (${modifiedFiles.length} fichier(s) modifié(s))`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    setDiffFile(null);
  }, [files, originalFiles, currentBranch]);

  const handleDiscardFileChanges = useCallback((fileId: string) => {
    const orig = originalFiles.get(fileId);
    if (orig !== undefined) {
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, content: orig, isModified: false } : f))
      );
      if (diffFile?.id === fileId) {
        setDiffFile(null);
      }
    }
  }, [originalFiles, diffFile]);

  const handleDiscardAllChanges = useCallback(() => {
    setFiles((prev) =>
      prev.map((f) => {
        const orig = originalFiles.get(f.id);
        return orig !== undefined ? { ...f, content: orig, isModified: false } : f;
      })
    );
    setDiffFile(null);
  }, [originalFiles]);

  const handleChangeBranch = useCallback((branch: string) => {
    if (!branches.includes(branch)) {
      setBranches((prev) => [...prev, branch]);
    }
    setCurrentBranch(branch);
    setConsoleEntries((prev) => [
      ...prev,
      {
        id: `branch-${Date.now()}`,
        type: 'system',
        message: `🌿 Basculement vers la branche Git '${branch}'`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  }, [branches]);

  // 12. Exécution des Tests Unitaires (Vitest / Jest)
  const handleRunAllTests = useCallback(async () => {
    setIsRunningTests(true);
    setTestSuite((prev) => ({
      ...prev,
      tests: prev.tests.map((t) => ({ ...t, status: 'running' })),
    }));

    try {
      const { suite, summary } = await runTestSuite(testSuite, currentFile.content);
      setTestSuite(suite);

      const statusIcon = summary.failed > 0 ? '❌' : '✅';
      setConsoleEntries((prev) => [
        ...prev,
        {
          id: `test-${Date.now()}`,
          type: summary.failed > 0 ? 'error' : 'info',
          message: `${statusIcon} [Vitest] ${suite.suiteName} : ${summary.passed}/${summary.total} réussis, ${summary.failed} échoués (${summary.durationMs}ms)`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsRunningTests(false);
    }
  }, [testSuite, currentFile.content]);

  const handleGenerateAiTests = useCallback(async () => {
    setIsGeneratingAiTests(true);
    try {
      const res = await fetch('/api/ai/generate-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: currentFile.name,
          code: currentFile.content,
          language: currentFile.language,
        }),
      });

      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      const newSuite: TestSuite = {
        id: `suite-ai-${Date.now()}`,
        fileName: currentFile.name,
        suiteName: data.suiteName || `${currentFile.name} (Tests Vitest)`,
        testCode: data.testCode || '',
        status: 'idle',
        tests: (data.tests || []).map((t: any) => ({
          id: t.id || `t-${Math.random()}`,
          title: t.title,
          status: 'idle',
        })),
      };
      setTestSuite(newSuite);
      setConsoleEntries((prev) => [
        ...prev,
        {
          id: `ai-test-${Date.now()}`,
          type: 'system',
          message: `✨ Suite Vitest générée avec succès pour '${currentFile.name}' (${newSuite.tests.length} tests).`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch {
      setConsoleEntries((prev) => [
        ...prev,
        {
          id: `ai-test-err-${Date.now()}`,
          type: 'error',
          message: 'Erreur lors de la génération de tests IA.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsGeneratingAiTests(false);
    }
  }, [currentFile.name, currentFile.content, currentFile.language]);

  const handleAutoFixTestError = useCallback((errorMessage: string) => {
    setIsChatOpen(true);
    handleRunAiDebugger();
  }, [handleRunAiDebugger]);

  // 13. Écoute globale des touches (F5, Cmd+L, Cmd+K, Cmd+Shift+G, Cmd+Shift+T)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // F5 pour exécuter
      if (e.key === 'F5') {
        e.preventDefault();
        handleRunCode();
      }
      // Cmd+Shift+D pour le Débogueur IA
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleRunAiDebugger();
      }
      // Cmd+Shift+G pour le panneau Git
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        setActiveSidebarView('git');
      }
      // Cmd+Shift+T pour le panneau de Tests
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setActiveSidebarView('tests');
        handleRunAllTests();
      }
      // Cmd+L pour basculer le chat
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setIsChatOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleRunCode, handleRunAiDebugger, handleRunAllTests]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0d0e12] text-[#d4d4d4] overflow-hidden select-none font-sans">
      {/* Top Header */}
      <Header
        currentFile={currentFile}
        files={files}
        onSelectFile={handleSelectFile}
        isRunning={isRunning}
        onRunCode={handleRunCode}
        onRunAiDebugger={handleRunAiDebugger}
        isAiDebugging={isAiDebugging}
        diagnostics={diagnostics}
        isTabCompletionEnabled={isTabCompletionEnabled}
        onToggleTabCompletion={() => setIsTabCompletionEnabled((prev) => !prev)}
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen((prev) => !prev)}
        isBottomPanelOpen={isBottomPanelOpen}
        onToggleBottomPanel={() => setIsBottomPanelOpen((prev) => !prev)}
        onResetWorkspace={handleResetWorkspace}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        currentBranch={currentBranch}
        modifiedCount={modifiedFilesCount}
        onOpenGit={() => setActiveSidebarView('git')}
      />

      {/* Main Studio Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar (Activity Bar, File Tree, Git & Tests Panel) */}
        <Sidebar
          files={files}
          originalFiles={originalFiles}
          currentFile={currentFile}
          onSelectFile={handleSelectFile}
          onAddFile={handleAddFile}
          onDeleteFile={handleDeleteFile}
          diagnostics={diagnostics}
          activeView={activeSidebarView}
          onChangeView={(view) => {
            setActiveSidebarView(view);
            if (view === 'terminal') setIsBottomPanelOpen(true);
            if (view === 'composer') setIsChatOpen(true);
            if (view === 'tests') handleRunAllTests();
            if (view === 'debugger') {
              setIsBottomPanelOpen(true);
              handleRunAiDebugger();
            }
          }}
          gitHistory={gitHistory}
          currentBranch={currentBranch}
          branches={branches}
          onChangeBranch={handleChangeBranch}
          onCommit={handleCommit}
          onDiscardFileChanges={handleDiscardFileChanges}
          onDiscardAllChanges={handleDiscardAllChanges}
          onOpenFileDiff={(file) => setDiffFile(file)}
          testSuite={testSuite}
          isRunningTests={isRunningTests}
          onRunAllTests={handleRunAllTests}
          onGenerateAiTests={handleGenerateAiTests}
          isGeneratingAiTests={isGeneratingAiTests}
          onAutoFixTestError={handleAutoFixTestError}
        />

        {/* Center: Editor OR DiffViewer + Bottom Panel */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Floating Cmd+K Widget */}
          <InlineEditWidget
            state={inlineEditState}
            onClose={() => setInlineEditState((prev) => ({ ...prev, isOpen: false }))}
            onSubmit={handleSubmitInlineEdit}
            onAccept={handleAcceptInlineEdit}
            onReject={handleRejectInlineEdit}
          />

          {/* Core Code Editor OR Diff Viewer */}
          {diffFile ? (
            <DiffViewer
              fileName={diffFile.name}
              originalContent={originalFiles.get(diffFile.id) || ''}
              currentContent={diffFile.content}
              language={diffFile.language}
              branchName={currentBranch}
              onClose={() => setDiffFile(null)}
              onDiscardChanges={() => handleDiscardFileChanges(diffFile.id)}
            />
          ) : (
            <CodeEditor
              currentFile={currentFile}
              openFiles={openFiles}
              onSelectFile={handleSelectFile}
              onCloseFile={handleCloseFile}
              onCodeChange={handleCodeChange}
              diagnostics={diagnostics}
              breakpoints={breakpoints}
              onToggleBreakpoint={handleToggleBreakpoint}
              ghostCompletion={ghostCompletion}
              onAcceptGhostCompletion={handleAcceptGhostCompletion}
              onDismissGhostCompletion={handleDismissGhostCompletion}
              onTriggerInlineEdit={handleTriggerInlineEdit}
              onFixDiagnostic={handleFixDiagnostic}
              onRunAiDebugger={handleRunAiDebugger}
            />
          )}

          {/* Bottom Panel (Terminal, Diagnostics, AI Deep Debugger, Watch) */}
          <BottomPanel
            isOpen={isBottomPanelOpen}
            onClose={() => setIsBottomPanelOpen(false)}
            consoleEntries={consoleEntries}
            onClearConsole={() => setConsoleEntries([])}
            onRunCode={handleRunCode}
            isRunning={isRunning}
            diagnostics={diagnostics}
            onFixDiagnostic={handleFixDiagnostic}
            breakpoints={breakpoints}
            onToggleBreakpoint={handleToggleBreakpoint}
            aiDebugResult={aiDebugResult}
            isAiDebugging={isAiDebugging}
            onRunAiDebugger={handleRunAiDebugger}
            onApplyAiDebugFix={handleApplyAiDebugFix}
            currentFile={currentFile}
          />
        </div>

        {/* Right Sidebar: GRACIAS Composer & AI Assistant */}
        <AiChatPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          currentFile={currentFile}
          onApplyCodeToFile={handleCodeChange}
          onInsertCodeAtCursor={(snippet) => {
            handleCodeChange(currentFile.content + '\n' + snippet);
          }}
        />
      </div>

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
