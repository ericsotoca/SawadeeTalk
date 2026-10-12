import React from 'react';
import {
  Settings,
  Clock,
  Scissors,
  EyeOff,
  CheckCircle2,
  X,
  Smartphone,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chunkDurationMinutes: number;
  onSetChunkDuration: (minutes: number) => void;
  continuousSegmenting: boolean;
  onToggleContinuous: (enabled: boolean) => void;
  autoStealthOnStart: boolean;
  onToggleAutoStealth: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  chunkDurationMinutes,
  onSetChunkDuration,
  continuousSegmenting,
  onToggleContinuous,
  autoStealthOnStart,
  onToggleAutoStealth,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center ring-1 ring-amber-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Paramètres d'enregistrement
              </h2>
              <p className="text-xs text-slate-400">
                Configuration de la durée, du découpage et de la discrétion
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Setting 1: Duration Selector (1 to 5 min) */}
        <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Durée des enregistrements (par tranche)</span>
            </label>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {chunkDurationMinutes} min active
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Choisissez la durée maximale d'une tranche d'enregistrement (entre 1 et 5 minutes). Dès que la durée choisie est atteinte, l'audio est automatiquement synthétisé et retranscrit avec son résumé et ses points clés.
          </p>

          <div className="grid grid-cols-5 gap-2 pt-1">
            {[1, 2, 3, 4, 5].map((mins) => {
              const isSelected = chunkDurationMinutes === mins;
              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => onSetChunkDuration(mins)}
                  className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-bold font-mono transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 scale-[1.02]'
                      : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700/80'
                  }`}
                >
                  <span className="text-base sm:text-lg leading-none">{mins}</span>
                  <span className="text-[10px] uppercase font-sans font-semibold opacity-90">min</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Setting 2: Continuous Auto-segmenting */}
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Scissors className="w-4 h-4 text-orange-400" />
              <span>Découpage continu en parties</span>
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Si l'enregistrement dure plus longtemps que la durée choisie ({chunkDurationMinutes} min), il est automatiquement découpé en tranches successives (Partie 1, Partie 2, etc.) sans aucune coupure de micro.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onToggleContinuous(!continuousSegmenting)}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1 ${
              continuousSegmenting ? 'bg-amber-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform transform absolute top-0.5 ${
                continuousSegmenting ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Setting 3: Stealth mode on start */}
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-emerald-400" />
              <span>Camouflage immédiat (Mode Discret)</span>
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dès que l'enregistrement démarre, l'écran bascule immédiatement sur une interface anodine (ex. Notes de voyage ou Convertisseur EUR/THB). Aucun symbole ni voyant d'enregistrement n'est affiché.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] text-amber-300 font-medium">
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span>Triple-clic (3 tapes rapides) sur l'écran pour revenir à la façade normale.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onToggleAutoStealth(!autoStealthOnStart)}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1 ${
              autoStealthOnStart ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform transform absolute top-0.5 ${
                autoStealthOnStart ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Setting 4: Synthesis & History Explanation */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2 font-semibold text-slate-200">
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span>Synthèse & Historique</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Chaque enregistrement ou tranche de {chunkDurationMinutes} min est transcrit et analysé pour produire :
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
            <li>Le résumé analytique en français de la discussion</li>
            <li>Les temps forts chronologiques et points clés</li>
            <li>La phonétique latine avec tons (aucune écriture thaïlandaise)</li>
            <li>La prononciation sonore immédiate au clic sur les mots français</li>
            <li>L'archivage dans l'historique des synthèses de discussion</li>
          </ul>
        </div>

        {/* Confirm / Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Valider et fermer</span>
        </button>
      </div>
    </div>
  );
};
