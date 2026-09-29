import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  Trash2,
  X,
  Copy,
  Check,
  Code2,
  ArrowRight,
  ShieldCheck,
  TestTube2,
  Zap,
  HelpCircle,
  FileCode,
  Wand2
} from 'lucide-react';
import { ChatMessage, CodeFile } from '../types/editor';

interface AiChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentFile: CodeFile;
  onApplyCodeToFile: (code: string) => void;
  onInsertCodeAtCursor: (code: string) => void;
}

export const AiChatPanel: React.FC<AiChatPanelProps> = ({
  isOpen,
  onClose,
  currentFile,
  onApplyCodeToFile,
  onInsertCodeAtCursor,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `👋 Bonjour ! Je suis **GRACIAS AI Composer**, votre pair programmer intelligent.

Je suis synchronisé avec votre fichier ouvert **\`${currentFile.name}\`**. Je peux :
- 🪄 **Refactorer ce fichier avec des patterns plus propres et modernes**
- 🔍 **Détecter les bugs asynchrones et logiques**
- ⚡ **Générer du code et des fonctionnalités avec GRACIAS Tab**
- 🧪 **Écrire des suites de tests unitaires**
- 🛡️ **Effectuer un audit de performance et de sécurité**

Comment puis-je vous aider aujourd'hui ?`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'composer' | 'refactor' | 'chat' | 'audit'>('composer');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query.trim(),
      timestamp: Date.now(),
      fileContext: currentFile.name,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const assistantMsgId = `assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
      },
    ]);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          currentFile: { name: currentFile.name, language: currentFile.language },
          currentCode: currentFile.content,
          mode,
        }),
      });

      if (!response.body) {
        throw new Error('Pas de corps de réponse');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.text) {
                accumulatedContent += data.text;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? { ...msg, content: accumulatedContent, isStreaming: true }
                      : msg
                  )
                );
              }
            } catch {
              // ignorer chunks non json
            }
          }
        }
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg
        )
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: `❌ Erreur : ${err?.message || 'Impossible de joindre le serveur IA.'}`,
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Extraction propre des blocs de code markdown pour boutons "Appliquer" et "Copier"
  const renderMessageContent = (content: string, msgId: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const lines = part.split('\n');
        const lang = lines[0].replace('```', '').trim() || 'code';
        const codeSnippet = lines.slice(1, -1).join('\n');
        const snippetId = `${msgId}-snippet-${index}`;

        return (
          <div key={index} className="my-2.5 rounded-lg overflow-hidden border border-[#2b3040] bg-[#0c0d12]">
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#141620] border-b border-[#232733] text-[11px] text-zinc-400">
              <span className="font-mono uppercase font-semibold text-zinc-300">{lang}</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => copyToClipboard(codeSnippet, snippetId)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-[#252938] text-zinc-300 transition cursor-pointer"
                  title="Copier le code"
                >
                  {copiedCodeId === snippetId ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedCodeId === snippetId ? 'Copié' : 'Copier'}</span>
                </button>

                <button
                  onClick={() => onApplyCodeToFile(codeSnippet)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 transition cursor-pointer"
                  title="Remplacer le fichier actif par ce code"
                >
                  <Code2 className="w-3 h-3" />
                  <span>Appliquer</span>
                </button>
              </div>
            </div>

            <pre className="p-3 overflow-x-auto text-xs font-mono text-zinc-200 leading-relaxed">
              <code>{codeSnippet}</code>
            </pre>
          </div>
        );
      }

      // Paragraphes normaux avec formatage basique (gras, puces, inline code)
      return (
        <div key={index} className="whitespace-pre-wrap leading-relaxed text-xs text-zinc-200">
          {part}
        </div>
      );
    });
  };

  const handleRefactorThisFile = () => {
    setMode('refactor');
    handleSendMessage(
      `Refactor this file (${currentFile.name}): Analyze the code structure, suggest cleaner design patterns, improve readability and maintainability, eliminate redundancies and anti-patterns, and provide the complete refactored code ready for application.`
    );
  };

  const SUGGESTED_ACTIONS = [
    {
      label: 'Refactor this file',
      icon: Wand2,
      prompt: `Refactor this file (${currentFile.name}): suggest cleaner code patterns, improve readability, modularity, and error handling with full refactored code.`,
    },
    {
      label: 'Détecter les bugs & corriger',
      icon: Zap,
      prompt: 'Analyse en profondeur le fichier et liste tous les bugs, failles et améliorations possibles avec le correctif.',
    },
    {
      label: 'Générer les tests unitaires',
      icon: TestTube2,
      prompt: 'Génère une suite de tests unitaires complète avec Vitest/Jest pour tester tous les cas nominaux et d’erreurs de ce fichier.',
    },
    {
      label: 'Audit sécurité & perf',
      icon: ShieldCheck,
      prompt: 'Effectue un audit de sécurité et de performances sur ce code, en pointant les vulnérabilités potentielles.',
    },
    {
      label: 'Expliquer l’architecture',
      icon: HelpCircle,
      prompt: 'Explique pas à pas comment fonctionne ce code et son architecture.',
    },
  ];

  return (
    <div className="w-96 border-l border-[#232730] bg-[#101218] flex flex-col h-full select-none z-20">
      {/* Header */}
      <div className="h-12 border-b border-[#232730] bg-[#12141c] px-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <span className="text-xs font-bold text-white tracking-wide font-sans">
            GRACIAS Composer
          </span>
          <span className="text-[10px] bg-purple-950/60 text-purple-300 px-1.5 py-0.2 rounded border border-purple-800/40 font-mono">
            Agent
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setMessages([])}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-[#1f2330] cursor-pointer"
            title="Effacer la conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-[#1f2330] cursor-pointer"
            title="Fermer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex border-b border-[#232730] bg-[#0d0f14] p-1 gap-1 text-[11px] font-medium">
        <button
          onClick={() => setMode('composer')}
          className={`flex-1 py-1 rounded text-center transition cursor-pointer ${
            mode === 'composer'
              ? 'bg-[#1e2230] text-purple-300 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Composer
        </button>
        <button
          onClick={handleRefactorThisFile}
          className={`flex-1 py-1 rounded text-center transition cursor-pointer ${
            mode === 'refactor'
              ? 'bg-purple-600/30 text-purple-200 font-semibold border border-purple-500/40'
              : 'text-zinc-400 hover:text-purple-300'
          }`}
          title="Refactorer ce fichier avec des patterns plus propres"
        >
          Refactor
        </button>
        <button
          onClick={() => setMode('chat')}
          className={`flex-1 py-1 rounded text-center transition cursor-pointer ${
            mode === 'chat'
              ? 'bg-[#1e2230] text-purple-300 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Chat Q&A
        </button>
        <button
          onClick={() => setMode('audit')}
          className={`flex-1 py-1 rounded text-center transition cursor-pointer ${
            mode === 'audit'
              ? 'bg-[#1e2230] text-purple-300 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Audit
        </button>
      </div>

      {/* Context Badge (Current Open File) */}
      <div className="px-3 py-1.5 bg-[#141620] border-b border-[#1f2330] flex items-center justify-between text-[11px] text-zinc-400">
        <div className="flex items-center gap-1.5 truncate">
          <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="text-zinc-300 font-mono truncate">{currentFile.name}</span>
          <span className="text-[10px] text-zinc-500">
            ({currentFile.content.split('\n').length} lignes)
          </span>
        </div>

        <button
          onClick={handleRefactorThisFile}
          disabled={isLoading}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-[10px] font-semibold transition cursor-pointer disabled:opacity-40 shadow-sm"
          title="Refactorer ce fichier avec des patterns plus propres"
        >
          <Wand2 className="w-3 h-3 text-purple-300" />
          <span>Refactor this file</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 font-sans">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[95%] rounded-xl p-3 text-xs shadow-sm ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-br-none'
                  : 'bg-[#181a24] border border-[#272b3a] rounded-bl-none'
              }`}
            >
              {renderMessageContent(msg.content, msg.id)}

              {msg.isStreaming && (
                <div className="flex items-center gap-1.5 text-purple-400 mt-2 font-mono text-[11px]">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>L'IA rédige...</span>
                </div>
              )}
            </div>
            <span className="text-[10px] text-zinc-600 mt-1 px-1">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Suggestion Chips */}
      <div className="p-2 border-t border-[#232730] bg-[#12141c] flex flex-wrap gap-1">
        {SUGGESTED_ACTIONS.map((action, i) => {
          const Icon = action.icon;
          return (
            <button
              key={i}
              onClick={() => handleSendMessage(action.prompt)}
              disabled={isLoading}
              className="text-[11px] px-2 py-1 rounded bg-[#191d28] hover:bg-[#222736] text-zinc-300 hover:text-white border border-[#2a3042] transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Icon className="w-3 h-3 text-purple-400" />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* Input Box Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-3 border-t border-[#232730] bg-[#0e1016]">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Posez une question, demandez du code ou un refactoring (Entrée pour envoyer)..."
            rows={2}
            className="w-full bg-[#161822] border border-[#2c3144] focus:border-purple-500 rounded-lg p-2.5 pr-10 text-xs text-white placeholder-zinc-500 outline-none resize-none font-sans"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2.5 bottom-3.5 p-1.5 rounded-md bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
