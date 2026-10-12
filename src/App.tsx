/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Mic,
  FileSpreadsheet,
  History,
  AlertCircle,
  HelpCircle,
  X,
  Settings,
  Volume2,
  Clock,
  Scissors,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { StudySheet } from './types';
import { AudioRecorder } from './components/AudioRecorder';
import { StudySheetView } from './components/StudySheetView';
import { SessionHistoryView } from './components/SessionHistoryView';
import { AnalysisProgressModal } from './components/AnalysisProgressModal';
import { StealthDecoyView } from './components/StealthDecoyView';
import { SettingsModal } from './components/SettingsModal';
import { sanitizeStudySheet } from './utils/thaiSanitizer';

export default function App() {
  const [activeTab, setActiveTab] = useState<'recorder' | 'sheet' | 'history' | 'settings'>('recorder');
  const [sheets, setSheets] = useState<StudySheet[]>(() => {
    try {
      const saved = localStorage.getItem('sawasdee_sheets');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.map(sanitizeStudySheet) : [];
    } catch {
      return [];
    }
  });
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isDemoAnalysis, setIsDemoAnalysis] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPedagogicalGuide, setShowPedagogicalGuide] = useState<boolean>(false);
  const [isInStealth, setIsInStealth] = useState<boolean>(false);

  // Settings State (persisted in localStorage)
  const [chunkDurationMinutes, setChunkDurationMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('sawasdee_chunk_min');
    return saved ? parseInt(saved, 10) : 2; // Default 2 minutes
  });
  const [autoStealthOnStart, setAutoStealthOnStart] = useState<boolean>(() => {
    const saved = localStorage.getItem('sawasdee_auto_stealth');
    return saved !== null ? saved === 'true' : true; // Default enabled
  });
  const [continuousSegmenting, setContinuousSegmenting] = useState<boolean>(() => {
    const saved = localStorage.getItem('sawasdee_continuous');
    return saved !== null ? saved === 'true' : true; // Default enabled
  });
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  const handleSetChunkDuration = (minutes: number) => {
    setChunkDurationMinutes(minutes);
    try {
      localStorage.setItem('sawasdee_chunk_min', minutes.toString());
    } catch (e) {
      console.warn('Erreur sauvegarde localStorage:', e);
    }
  };

  const handleToggleAutoStealth = (enabled: boolean) => {
    setAutoStealthOnStart(enabled);
    try {
      localStorage.setItem('sawasdee_auto_stealth', enabled.toString());
    } catch (e) {
      console.warn('Erreur sauvegarde localStorage:', e);
    }
  };

  const handleToggleContinuous = (enabled: boolean) => {
    setContinuousSegmenting(enabled);
    try {
      localStorage.setItem('sawasdee_continuous', enabled.toString());
    } catch (e) {
      console.warn('Erreur sauvegarde localStorage:', e);
    }
  };

  // Sync to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('sawasdee_sheets', JSON.stringify(sheets));
    } catch (e) {
      console.warn('Erreur sauvegarde localStorage:', e);
    }
  }, [sheets]);

  // Active study sheet
  const currentSheet = sheets.find((s) => s.id === activeSheetId) || sheets[0] || null;

  // Handle Audio Analysis via backend (supports background chunking)
  const handleAnalyzeAudio = async (
    audioBase64: string,
    mimeType: string,
    durationSeconds: number,
    partNumber?: number,
    sessionId?: string
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
          partNumber,
          sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur serveur (${response.status})`);
      }

      const data = await response.json();
      if (!data.success || !data.sheet) {
        throw new Error("L'analyse n'a pas renvoyé de synthèse de discussion valide.");
      }

      const newSheet: StudySheet = sanitizeStudySheet(data.sheet);
      setSheets((prev) => [newSheet, ...prev]);
      setActiveSheetId(newSheet.id);

      // Only switch to sheet view if user is NOT in stealth mode
      if (!isInStealth) {
        setActiveTab('sheet');
      }
    } catch (err: any) {
      console.error('Erreur handleAnalyzeAudio:', err);
      setErrorMessage(
        err.message || 'Impossible d’analyser cet audio. Veuillez vérifier votre connexion.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectDemoScenario = async (scenarioId: string) => {
    setIsAnalyzing(true);
    setIsDemoAnalysis(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/demo-scenario/${scenarioId}`);
      if (!response.ok) {
        throw new Error('Scénario introuvable.');
      }
      const data = await response.json();
      const newSheet: StudySheet = sanitizeStudySheet(data.sheet);
      setSheets((prev) => [newSheet, ...prev]);
      setActiveSheetId(newSheet.id);
      setActiveTab('sheet');
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors du chargement de la démonstration.');
    } finally {
      setIsAnalyzing(false);
      setIsDemoAnalysis(false);
    }
  };

  const handleDeleteSheet = (id: string) => {
    setSheets((prev) => prev.filter((s) => s.id !== id));
    if (activeSheetId === id) {
      const remaining = sheets.filter((s) => s.id !== id);
      setActiveSheetId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleClearSession = () => {
    if (window.confirm('Voulez-vous réinitialiser toutes les synthèses enregistrées ?')) {
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
      setActiveTab('sheet');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white font-bold">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base sm:text-lg tracking-tight text-white">
                  Sawasdee Talk
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                  Synthèse & Oral
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Synthèse des conversations réelles • Prononciation au clic sur les mots français
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bouton Paramètres de Durée TRÈS VISIBLE */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
                activeTab === 'settings'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/20'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
              }`}
              title="Paramétrer la durée des enregistrements (1 à 5 min)"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold">Durée :</span>
              <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-200 font-mono font-bold border border-amber-500/40">
                {chunkDurationMinutes} min
              </span>
            </button>

            <button
              onClick={() => setShowPedagogicalGuide(true)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Consulter le guide de la méthode"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Méthode</span>
            </button>
          </div>
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
            title="Consulter la synthèse de la discussion"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Synthèse</span>
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
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer relative ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Paramétrer la durée (1 à 5 min) et les options"
          >
            <Settings className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span className="truncate">Paramètres</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-[10px] text-amber-300 font-mono font-bold">
              {chunkDurationMinutes}m
            </span>
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
            onEnterStealth={() => setIsInStealth(true)}
            isInStealth={isInStealth}
            chunkDurationMinutes={chunkDurationMinutes}
            onSetChunkDuration={handleSetChunkDuration}
            continuousSegmenting={continuousSegmenting}
            onToggleContinuous={handleToggleContinuous}
            autoStealthOnStart={autoStealthOnStart}
            onToggleAutoStealth={handleToggleAutoStealth}
            onOpenSettingsModal={() => setActiveTab('settings')}
          />
        )}

        {activeTab === 'sheet' && currentSheet && (
          <StudySheetView
            sheet={currentSheet}
            onNewRecording={() => setActiveTab('recorder')}
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
            onImportSheets={handleImportSheets}
          />
        )}

        {activeTab === 'settings' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center ring-1 ring-amber-500/30">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Paramètres d'enregistrement & Durée
                  </h2>
                  <p className="text-xs text-slate-400">
                    Réglez facilement la durée de vos tranches d'enregistrement (1 à 5 minutes)
                  </p>
                </div>
              </div>

              {/* Paramètre 1 : Durée des enregistrements (1 à 5 min) */}
              <div className="bg-slate-950/80 border border-amber-500/30 p-5 rounded-2xl space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Durée de l'enregistrement par tranche</span>
                  </label>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {chunkDurationMinutes} minute{chunkDurationMinutes > 1 ? 's' : ''} active
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Choisissez la durée maximale d'un segment audio. Dès que ce temps est écoulé, la discussion est automatiquement synthétisée en <strong>résumé analytique</strong>, <strong>points clés</strong>, et <strong>vocabulaire oral au clic</strong>.
                </p>

                <div className="grid grid-cols-5 gap-2.5 pt-1">
                  {[1, 2, 3, 4, 5].map((m) => {
                    const isSelected = chunkDurationMinutes === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleSetChunkDuration(m)}
                        className={`py-3.5 px-2 rounded-2xl text-xs sm:text-sm font-bold font-mono transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950 scale-105 font-black'
                            : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:text-white'
                        }`}
                      >
                        <span className="text-lg sm:text-xl font-black">{m}</span>
                        <span className="text-[10px] uppercase font-sans font-semibold">min</span>
                      </button>
                    );
                  })}
                </div>

                <div className="text-[11px] text-amber-300/90 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Chaque enregistrement de <strong>{chunkDurationMinutes} min</strong> génère immédiatement une synthèse complète de la discussion.
                  </span>
                </div>
              </div>

              {/* Paramètre 2 : Découpage continu */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-orange-400" />
                    <span>Découpage continu en parties</span>
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Si votre échange se prolonge, l'enregistrement se découpe en tranches successives (Partie 1, Partie 2...) sans interrompre le micro.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleContinuous(!continuousSegmenting)}
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

              {/* Paramètre 3 : Mode Discret */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-emerald-400" />
                    <span>Camouflage immédiat (Mode Discret)</span>
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Bascule dès le début sur un écran anodin (Notes de voyage ou Convertisseur). Aucun voyant d'enregistrement affiché.
                  </p>
                  <p className="text-[11px] text-amber-300 font-medium pt-1">
                    💡 Un triple-clic n'importe où sur l'écran camouflé permet de revenir à la façade de départ.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleAutoStealth(!autoStealthOnStart)}
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

              {/* Note sur les directives de l'application */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                <p className="font-bold text-amber-300">
                  📋 Directives de l'application :
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li><strong>Synthèse des discussions :</strong> Résumé précis, temps forts et points clés des échanges oraux.</li>
                  <li><strong>Aucune écriture thaïlandaise :</strong> 100% en transcription phonétique latine avec tons.</li>
                  <li><strong>Prononciation au clic :</strong> Cliquez sur n'importe quel mot français pour afficher et écouter sa prononciation orale immédiate.</li>
                  <li><strong>Sans flashcard :</strong> L'accent est entièrement mis sur la synthèse et la compréhension directe.</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('recorder')}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Mic className="w-4 h-4" />
                <span>Aller à l'enregistreur ({chunkDurationMinutes} min)</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Progress Modal (suppressed during stealth mode to remain 100% discrete) */}
      <AnalysisProgressModal isOpen={isAnalyzing && !isInStealth} isDemo={isDemoAnalysis} />

      {/* Camouflage / Mode Discret (Stealth Decoy) Full-Screen View */}
      {isInStealth && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900 animate-in fade-in duration-150">
          <StealthDecoyView
            onExitStealth={() => setIsInStealth(false)}
          />
        </div>
      )}

      {/* Settings Modal (accessible if triggered) */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        chunkDurationMinutes={chunkDurationMinutes}
        onSetChunkDuration={handleSetChunkDuration}
        continuousSegmenting={continuousSegmenting}
        onToggleContinuous={handleToggleContinuous}
        autoStealthOnStart={autoStealthOnStart}
        onToggleAutoStealth={handleToggleAutoStealth}
      />

      {/* Pedagogical Methodology Guide Modal */}
      {showPedagogicalGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Méthode & Guide Didactique</h3>
              </div>
              <button
                onClick={() => setShowPedagogicalGuide(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 space-y-1">
                <h4 className="font-bold text-amber-300">
                  1. Synthèse de la discussion & Pas d'alphabet thaï
                </h4>
                <p className="text-slate-300">
                  L'apprentissage se concentre sur l'écoute active et la synthèse des conversations réelles. Aucun caractère thaï n'est utilisé dans l'application : tout est transcrit en phonétique latine avec indication précise des tons pour les francophones.
                </p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-1.5">
                <h4 className="font-bold text-orange-300">
                  2. Prononciation orale au clic sur les mots français
                </h4>
                <p className="text-slate-400">
                  Dans la synthèse de discussion, cliquez sur n'importe quel mot ou phrase en français pour ouvrir sa fiche de prononciation immédiate, écouter son audio authentique avec les bons tons et voir comment le prononcer naturellement.
                </p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-1.5">
                <h4 className="font-bold text-teal-300">
                  3. Découpage par tranches (1 à 5 minutes)
                </h4>
                <p className="text-slate-400">
                  Choisissez la durée adaptée à votre situation (marché, restaurant, taxi...). Le découpage continu permet d'analyser des échanges plus longs sans interruption.
                </p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-1.5">
                <h4 className="font-bold text-purple-300">
                  4. Particules de politesse (khrap / kha)
                </h4>
                <p className="text-slate-400">
                  En thaï, la politesse est primordiale. Chaque fin de phrase s'accompagne de <strong>khrap</strong> (si vous êtes un homme) ou <strong>kha</strong> (si vous êtes une femme).
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPedagogicalGuide(false)}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
