/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Mic,
  FileSpreadsheet,
  History,
  Languages,
  Sparkles,
  Info,
  AlertCircle,
  HelpCircle,
  X,
  GraduationCap,
} from 'lucide-react';
import { StudySheet } from './types';
import { AudioRecorder } from './components/AudioRecorder';
import { StudySheetView } from './components/StudySheetView';
import { SessionHistoryView } from './components/SessionHistoryView';
import { FlashcardsView } from './components/FlashcardsView';
import { AnalysisProgressModal } from './components/AnalysisProgressModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'recorder' | 'sheet' | 'history' | 'flashcards'>('recorder');
  const [sheets, setSheets] = useState<StudySheet[]>([]);
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [flashcardTargetSheetId, setFlashcardTargetSheetId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isDemoAnalysis, setIsDemoAnalysis] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPedagogicalGuide, setShowPedagogicalGuide] = useState<boolean>(false);

  // Active study sheet
  const currentSheet = sheets.find((s) => s.id === activeSheetId) || sheets[0] || null;
  const totalExpressionsCount = sheets.reduce((acc, s) => acc + s.expressions.length, 0);

  const handleOpenFlashcards = (sheetId?: string) => {
    setFlashcardTargetSheetId(sheetId || 'all');
    setActiveTab('flashcards');
  };

  // Handle Audio Analysis via backend
  const handleAnalyzeAudio = async (
    audioBase64: string,
    mimeType: string,
    durationSeconds: number
  ) => {
    setIsAnalyzing(true);
    setIsDemoAnalysis(false);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/analyze-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType,
          durationSeconds,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Impossible d'analyser l'audio.");
      }

      const newSheet: StudySheet = data.sheet;
      setSheets((prev) => [newSheet, ...prev]);
      setActiveSheetId(newSheet.id);
      setActiveTab('sheet');
    } catch (err: any) {
      console.error('Erreur API:', err);
      setErrorMessage(
        err.message ||
          "Une erreur réseau ou de traitement est survenue. Veuillez vérifier votre connexion et réessayer."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle Demo Scenarios
  const handleSelectDemoScenario = async (scenarioId: string) => {
    setIsAnalyzing(true);
    setIsDemoAnalysis(true);
    setErrorMessage(null);

    try {
      // Small graceful delay to let user see the steps checkmark smoothly
      const [response] = await Promise.all([
        fetch('/api/demo-scenario', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenarioId }),
        }),
        new Promise((resolve) => setTimeout(resolve, 800)),
      ]);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Impossible de charger le scénario.");
      }

      const newSheet: StudySheet = data.sheet;
      setSheets((prev) => [newSheet, ...prev]);
      setActiveSheetId(newSheet.id);
      setActiveTab('sheet');
    } catch (err: any) {
      console.error('Erreur démo:', err);
      setErrorMessage(err.message || "Erreur de chargement du scénario de démonstration.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Session handlers
  const handleDeleteSheet = (id: string) => {
    setSheets((prev) => prev.filter((s) => s.id !== id));
    if (activeSheetId === id) {
      const remaining = sheets.filter((s) => s.id !== id);
      setActiveSheetId(remaining.length > 0 ? remaining[0].id : null);
      if (remaining.length === 0) {
        setActiveTab('recorder');
      }
    }
  };

  const handleClearSession = () => {
    if (window.confirm("Êtes-vous sûr de vouloir réinitialiser la session ? Toutes les fiches non téléchargées seront effacées.")) {
      setSheets([]);
      setActiveSheetId(null);
      setActiveTab('recorder');
    }
  };

  const handleImportSheets = (newSheets: StudySheet[]) => {
    setSheets((prev) => {
      const existingIds = new Set(prev.map((s) => s.id));
      const nonDuplicates = newSheets.filter((s) => !existingIds.has(s.id));
      return [...nonDuplicates, ...prev];
    });
    if (newSheets.length > 0) {
      setActiveSheetId(newSheets[0].id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white font-bold">
              <span className="font-['Sarabun'] text-xl leading-none">ส</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base sm:text-lg tracking-tight text-white">
                  Sawasdee Talk
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                  Thaï Réel
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Apprentissage oral à partir de conversations réelles (max 1 min)
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowPedagogicalGuide(true)}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Consulter le guide pédagogique"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Méthode & Guide</span>
          </button>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <nav className="border-b border-slate-800/60 bg-slate-950 px-4 py-2 sticky top-[61px] z-30">
        <div className="max-w-lg mx-auto grid grid-cols-4 gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800/90">
          <button
            onClick={() => setActiveTab('recorder')}
            className={`py-2 px-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'recorder'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Enregistrer</span>
          </button>

          <button
            onClick={() => setActiveTab('sheet')}
            disabled={!currentSheet}
            className={`py-2 px-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer relative ${
              activeTab === 'sheet'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : currentSheet
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 opacity-50 cursor-not-allowed'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Fiche</span>
            {currentSheet && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer relative ${
              activeTab === 'history'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Historique</span>
            {sheets.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-amber-300 font-mono">
                {sheets.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setFlashcardTargetSheetId('all');
              setActiveTab('flashcards');
            }}
            className={`py-2 px-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer relative ${
              activeTab === 'flashcards'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span className="truncate">Flashcards</span>
            {totalExpressionsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-amber-300 font-mono">
                {totalExpressionsCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="max-w-2xl mx-auto px-4 mt-4 w-full">
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-200 p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'recorder' && (
          <AudioRecorder
            onAnalyzeAudio={handleAnalyzeAudio}
            onSelectDemoScenario={handleSelectDemoScenario}
            isAnalyzing={isAnalyzing}
          />
        )}

        {activeTab === 'sheet' && currentSheet && (
          <StudySheetView
            sheet={currentSheet}
            onNewRecording={() => setActiveTab('recorder')}
            onOpenFlashcards={() => handleOpenFlashcards(currentSheet.id)}
          />
        )}

        {activeTab === 'history' && (
          <SessionHistoryView
            sheets={sheets}
            activeSheetId={activeSheetId}
            onSelectSheet={(id) => {
              setActiveSheetId(id);
              setActiveTab('sheet');
            }}
            onDeleteSheet={handleDeleteSheet}
            onClearSession={handleClearSession}
            onStartNewRecording={() => setActiveTab('recorder')}
            onOpenFlashcards={handleOpenFlashcards}
            onImportSheets={handleImportSheets}
          />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardsView
            sheets={sheets}
            initialSheetId={flashcardTargetSheetId}
            onSelectDemoScenario={handleSelectDemoScenario}
            onGoToHistory={() => setActiveTab('history')}
            onImportSheets={handleImportSheets}
          />
        )}
      </main>

      {/* Progress Modal */}
      <AnalysisProgressModal isOpen={isAnalyzing} isDemo={isDemoAnalysis} />

      {/* Pedagogical Guide Modal */}
      {showPedagogicalGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  💡
                </div>
                <h3 className="text-base font-bold text-white">
                  Guide d'utilisation & Méthode
                </h3>
              </div>
              <button
                onClick={() => setShowPedagogicalGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-1.5">
                <h4 className="font-bold text-amber-300">
                  1. Règle fondamentale de confidentialité
                </h4>
                <p className="text-slate-400">
                  Aucun dialogue intégral n'est transcrit ou stocké. L'intelligence artificielle segmente uniquement les mots lexicaux, les expressions utiles et les structures réutilisables.
                </p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-1.5">
                <h4 className="font-bold text-orange-300">
                  2. Pourquoi un décompte statistique réel ?
                </h4>
                <p className="text-slate-400">
                  En mémorisant en priorité les mots et structures qui reviennent le plus souvent dans vos vrais échanges (au marché, au restaurant, en taxi), vous progressez 3 fois plus vite vers la fluidité orale.
                </p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-1.5">
                <h4 className="font-bold text-teal-300">
                  3. Spécificités du thaï pour les francophones
                </h4>
                <p className="text-slate-400">
                  Le thaï est une langue tonale (5 tons : plat, bas, descendant, haut, montant). Chaque mot de la fiche comporte sa transcription simplifiée et ses tons pour vous guider phonétiquement.
                </p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-1.5">
                <h4 className="font-bold text-purple-300">
                  4. Particules de politesse (ครับ krap / ค่ะ ka)
                </h4>
                <p className="text-slate-400">
                  Elles sont essentielles pour ne pas paraître brusque en Thaïlande. Elles sont regroupées dans la section 4 avec les marqueurs de question (ไหม mai) pour apprendre à réagir naturellement.
                </p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-1.5">
                <h4 className="font-bold text-emerald-300">
                  5. Flashcards de révision nomade
                </h4>
                <p className="text-slate-400">
                  Retrouvez toutes les expressions capturées au cours de vos conversations sous forme de cartes d'apprentissage interactives. Entraînez-vous dans les deux sens (Thaï ➔ Français ou Français ➔ Thaï) avec audio direct.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPedagogicalGuide(false)}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
            >
              Compris, fermer le guide
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-4 px-6 border-t border-slate-900 text-center text-[11px] text-slate-400">
        <p>Sawasdee Talk — Développé pour les francophones apprenant le thaï oral • Conforme Google AI Studio</p>
      </footer>
    </div>
  );
}
