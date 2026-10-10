import React, { useState, useEffect } from 'react';
import { Sparkles, BrainCircuit, Activity, BookOpen, Check, Loader2 } from 'lucide-react';

interface AnalysisProgressModalProps {
  isOpen: boolean;
  isDemo?: boolean;
}

const STEPS = [
  { label: "Envoi sécurisé du flux audio", icon: Activity },
  { label: "Transcription et segmentation phonétique du thaï", icon: BrainCircuit },
  { label: "Comptage réel des occurrences et élimination des bruits", icon: Sparkles },
  { label: "Génération de la fiche de vocabulaire et des tons", icon: BookOpen },
];

export const AnalysisProgressModal: React.FC<AnalysisProgressModalProps> = ({ isOpen, isDemo = false }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(10);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      setProgressPercent(10);
      return;
    }

    if (isDemo) {
      // Fast, slick animation for demo tracks (~1.2s total)
      const interval = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < STEPS.length - 1) return prev + 1;
          return prev;
        });
        setProgressPercent((p) => Math.min(100, p + 28));
      }, 250);

      return () => clearInterval(interval);
    } else {
      // Real audio analysis: smooth cadence
      const stepInterval = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < STEPS.length - 1) return prev + 1;
          return prev;
        });
      }, 1400);

      const progressInterval = setInterval(() => {
        setProgressPercent((prev) => {
          if (prev >= 96) return 96; // hold near 96% until real response resolves
          return prev + Math.floor(Math.random() * 8) + 4;
        });
      }, 350);

      return () => {
        clearInterval(stepInterval);
        clearInterval(progressInterval);
      };
    }
  }, [isOpen, isDemo]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
        {/* Pulsing AI badge */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping opacity-60" />
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Sparkles className="w-8 h-8 text-white animate-spin" style={{ animationDuration: '4s' }} />
          </div>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-xl font-bold text-white tracking-tight">
            {isDemo ? "Chargement de la démo..." : "Analyse de la conversation..."}
          </h3>
          <p className="text-xs text-slate-400">
            Extraction statistique et linguistique en cours (sans retranscription du dialogue).
          </p>
        </div>

        {/* Dynamic progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Progression de l'analyse</span>
            <span className="text-amber-400 font-bold">{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden ring-1 ring-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Step checklist */}
        <div className="space-y-3 text-left bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
          {STEPS.map((step, idx) => {
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const StepIcon = step.icon;

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 text-xs transition-all duration-300 ${
                  isCurrent
                    ? 'text-amber-400 font-semibold'
                    : isDone
                    ? 'text-emerald-400'
                    : 'text-slate-500 opacity-60'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
                      : isCurrent
                      ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isDone ? (
                    <Check className="w-3 h-3" />
                  ) : isCurrent ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <StepIcon className="w-3 h-3" />
                  )}
                </div>
                <span>{step.label}</span>
              </div>
            );
          })}
        </div>

        <div className="text-[11px] text-slate-500 italic">
          {isDemo
            ? "Extraction immédiate des statistiques réelles du scénario sélectionné."
            : "Optimisé avec Gemini 3.8 Flash pour une réponse rapide et précise."}
        </div>
      </div>
    </div>
  );
};
