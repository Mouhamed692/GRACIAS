import React from 'react';
import { X, Keyboard, Sparkles } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const SHORTCUTS = [
    {
      key: 'Tab ⇥',
      desc: 'Accepter la suggestion de complétion inline GRACIAS Tab',
      category: 'Complétion IA',
    },
    {
      key: 'Échap (Esc)',
      desc: 'Rejeter la suggestion de complétion ou fermer la commande inline',
      category: 'Complétion IA',
    },
    {
      key: 'Cmd + K / Ctrl + K',
      desc: 'Ouvrir l’éditeur inline (refactorer ou générer sur la sélection)',
      category: 'Édition & Génération',
    },
    {
      key: 'Cmd + Enter',
      desc: 'Valider et appliquer le diff proposé par la commande Cmd+K',
      category: 'Édition & Génération',
    },
    {
      key: 'F5',
      desc: 'Exécuter le code dans le bac à sable et afficher la console',
      category: 'Exécution & Débogage',
    },
    {
      key: 'Cmd + Shift + D',
      desc: 'Déclencher le Débogueur IA en temps réel avec Auto-Fix',
      category: 'Exécution & Débogage',
    },
    {
      key: 'Cmd + Shift + T',
      desc: 'Ouvrir le panneau de Tests Unitaires (Vitest / Jest) et lancer la suite',
      category: 'Tests & Qualité',
    },
    {
      key: 'Cmd + Shift + G',
      desc: 'Ouvrir le panneau Git Source Control & Staging',
      category: 'Contrôle de Version',
    },
    {
      key: 'Cmd + L',
      desc: 'Afficher / Masquer GRACIAS Composer & Chat',
      category: 'Navigation',
    },
    {
      key: 'Gouttière (Clic)',
      desc: 'Ajouter ou retirer un point d’arrêt (breakpoint) sur la ligne',
      category: 'Débogage',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in select-none">
      <div className="w-full max-w-lg bg-[#141620] border border-[#2d3244] rounded-xl shadow-2xl p-5 text-white">
        <div className="flex items-center justify-between pb-3 border-b border-[#242938]">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-sm">Raccourcis Clavier GRACIAS AI Studio</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-[#232736] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {SHORTCUTS.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2 rounded-lg bg-[#0e1017] border border-[#1f2330] text-xs"
            >
              <span className="text-zinc-300 font-sans">{sc.desc}</span>
              <kbd className="px-2 py-1 rounded bg-[#1c202d] border border-[#2f354a] text-indigo-300 font-mono text-[11px] font-semibold whitespace-nowrap shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t border-[#242938] flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 text-purple-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Moteur IA ultra-réactif activé</span>
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition cursor-pointer text-xs"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
