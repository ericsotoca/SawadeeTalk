import React, { useState, useMemo, useRef } from 'react';
import {
  Sparkles,
  Volume2,
  RotateCw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Download,
  Upload,
  Filter,
  GraduationCap,
  Layers,
  ArrowRightLeft,
  Flame,
  Award,
  AlertCircle,
  Check,
} from 'lucide-react';
import { StudySheet, FlashcardItem } from '../types';
import { playThaiAudio } from '../utils/thaiSpeech';
import { parseMultipleSheetFiles } from '../utils/importText';

interface FlashcardsViewProps {
  sheets: StudySheet[];
  initialSheetId?: string | null;
  onSelectDemoScenario?: (scenarioId: string) => void;
  onGoToHistory?: () => void;
  onImportSheets?: (newSheets: StudySheet[]) => void;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  sheets,
  initialSheetId = null,
  onSelectDemoScenario,
  onGoToHistory,
  onImportSheets,
}) => {
  // Config state
  const [selectedSheetId, setSelectedSheetId] = useState<string>(initialSheetId || 'all');
  const [contextFilter, setContextFilter] = useState<string>('all');
  const [practiceMode, setPracticeMode] = useState<'oral_to_fr' | 'fr_to_oral'>('oral_to_fr');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [playingAudio, setPlayingAudio] = useState<boolean>(false);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  // Deck progression state
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [reviewIds, setReviewIds] = useState<Set<string>>(new Set());
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [shuffledSeed, setShuffledSeed] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Extract all flashcards from history sheets
  const allCards = useMemo<FlashcardItem[]>(() => {
    const list: FlashcardItem[] = [];
    const targetSheets = selectedSheetId === 'all'
      ? sheets
      : sheets.filter((s) => s.id === selectedSheetId);

    targetSheets.forEach((sheet) => {
      sheet.expressions.forEach((exp, idx) => {
        list.push({
          id: `${sheet.id}_exp_${idx}_${exp.phonetic.replace(/\s+/g, '_')}`,
          sourceSheetTitle: sheet.title,
          sourceSheetId: sheet.id,
          thai: exp.thai,
          phonetic: exp.phonetic,
          pronunciationFr: exp.pronunciationFr,
          french: exp.french,
          context: exp.context,
          contextTag: exp.contextTag,
          exampleThai: exp.exampleThai,
          exampleFrench: exp.exampleFrench,
          occurrences: exp.occurrences,
        });
      });
    });

    // Deduplicate by identical phonetic transcription across sessions if any
    const uniqueMap = new Map<string, FlashcardItem>();
    list.forEach((item) => {
      const key = item.phonetic.toLowerCase().trim() || item.french.toLowerCase().trim();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    });

    let result = Array.from(uniqueMap.values());

    if (contextFilter !== 'all') {
      result = result.filter((item) => item.contextTag === contextFilter);
    }

    if (shuffledSeed > 0) {
      result = [...result].sort(() => Math.sin(shuffledSeed + result.length) - 0.5);
    }

    return result;
  }, [sheets, selectedSheetId, contextFilter, shuffledSeed]);

  const currentCard = allCards[currentIndex] || null;

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handlePlayAudio = (thaiText: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPlayingAudio(true);
    playThaiAudio(thaiText, () => {
      setPlayingAudio(false);
    });
  };

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < allCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleMarkMastered = () => {
    if (!currentCard) return;
    setMasteredIds((prev) => new Set(prev).add(currentCard.id));
    setReviewIds((prev) => {
      const next = new Set(prev);
      next.delete(currentCard.id);
      return next;
    });
    handleNext();
  };

  const handleMarkReview = () => {
    if (!currentCard) return;
    setReviewIds((prev) => new Set(prev).add(currentCard.id));
    setMasteredIds((prev) => {
      const next = new Set(prev);
      next.delete(currentCard.id);
      return next;
    });
    handleNext();
  };

  const handleRestartAll = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredIds(new Set());
    setReviewIds(new Set());
    setIsCompleted(false);
  };

  const handleRestartReviewOnly = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
  };

  const handleShuffle = () => {
    setShuffledSeed(Date.now());
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
  };

  // Multi-file import handler (up to 5 files)
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const { successSheets, errorCount } = await parseMultipleSheetFiles(files);

    if (successSheets.length > 0 && onImportSheets) {
      onImportSheets(successSheets);
      const totalExpr = successSheets.reduce((acc, s) => acc + s.expressions.length, 0);
      setImportNotification(`${successSheets.length} fiche(s) importée(s) avec succès ! (+${totalExpr} expressions prêtes pour les flashcards).`);
      setSelectedSheetId('all');
      setCurrentIndex(0);
      setIsCompleted(false);
      setTimeout(() => setImportNotification(null), 5000);
    } else if (errorCount > 0) {
      setImportNotification("Impossible de lire les fichiers sélectionnés. Assurez-vous d'utiliser des fichiers texte (.txt) exportés depuis l'application.");
      setTimeout(() => setImportNotification(null), 5000);
    }

    if (e.target) e.target.value = '';
  };

  // Export flashcards as Anki/Quizlet compatible TSV (Focused on oral pronunciation)
  const handleExportAnkiTSV = () => {
    if (allCards.length === 0) return;
    const lines: string[] = [];
    lines.push('# Flashcards Oral Thaï - Sawasdee Talk');
    lines.push('# Front (Prononciation RTGS & Tons)\tBack (Français)\tContexte');

    allCards.forEach((c) => {
      const front = `${c.phonetic} [${c.pronunciationFr}]`;
      const back = c.french;
      const context = c.context;
      lines.push(`${front}\t${back}\t${context}`);
    });

    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), lines.join('\n')], {
      type: 'text/tab-separated-values;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashcards_thai_oral_${new Date().toISOString().slice(0, 10)}.tsv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // If no sheets in history yet
  if (sheets.length === 0) {
    return (
      <div className="w-full max-w-xl mx-auto py-10 px-6 text-center space-y-5 bg-slate-900/70 border border-slate-800 rounded-3xl shadow-xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <GraduationCap className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-white">
            Aucune expression disponible pour les flashcards
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Vous pouvez enregistrer une conversation ou <strong className="text-amber-300">importer jusqu'à 5 fiches texte (.txt)</strong> téléchargées précédemment pour générer vos flashcards orales.
          </p>
        </div>

        {/* Import file button in empty state */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <Upload className="w-4 h-4" />
            <span>Importer des fiches (.txt)</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.json"
            onChange={handleFilesSelected}
            className="hidden"
          />
        </div>

        {onSelectDemoScenario && (
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Ou tester immédiatement avec un scénario type :
            </span>
            <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
              <button
                onClick={() => onSelectDemoScenario('streetfood')}
                className="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer"
              >
                🍜 Street Food
              </button>
              <button
                onClick={() => onSelectDemoScenario('market')}
                className="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer"
              >
                🛍️ Marché
              </button>
              <button
                onClick={() => onSelectDemoScenario('taxi')}
                className="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer"
              >
                🚕 Taxi
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // If filtered out completely
  if (allCards.length === 0) {
    return (
      <div className="w-full max-w-xl mx-auto py-10 px-6 text-center space-y-4 bg-slate-900/70 border border-slate-800 rounded-3xl">
        <Layers className="w-10 h-10 text-slate-500 mx-auto" />
        <h3 className="text-base font-bold text-white">
          Aucune expression pour ce filtre
        </h3>
        <p className="text-xs text-slate-400">
          Modifiez vos filtres de sélection de conversation ou de thématique ci-dessous.
        </p>
        <button
          onClick={() => {
            setSelectedSheetId('all');
            setContextFilter('all');
          }}
          className="py-2 px-4 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
        >
          Réinitialiser les filtres
        </button>
      </div>
    );
  }

  // Completion screen
  if (isCompleted) {
    const totalCount = allCards.length;
    const masteredCount = masteredIds.size;
    const reviewCount = reviewIds.size;
    const scorePct = Math.round((masteredCount / totalCount) * 100);

    return (
      <div className="w-full max-w-md mx-auto py-10 px-6 text-center space-y-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl animate-fadeIn">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
          <Award className="w-10 h-10" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-white tracking-tight">
            Session de Flashcards terminée !
          </h2>
          <p className="text-xs text-slate-400">
            Félicitations pour votre entraînement sur les expressions orales.
          </p>
        </div>

        {/* Score Card */}
        <div className="grid grid-cols-3 gap-2.5 bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80">
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total</span>
            <span className="text-xl font-bold font-mono text-white">{totalCount}</span>
          </div>
          <div className="text-center border-x border-slate-800">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Maîtrisées</span>
            <span className="text-xl font-bold font-mono text-emerald-400">{masteredCount}</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">À revoir</span>
            <span className="text-xl font-bold font-mono text-amber-400">{reviewCount}</span>
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-300">
          Taux de maîtrise orale : <strong className="text-emerald-400 text-sm">{scorePct}%</strong>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {reviewCount > 0 && (
            <button
              onClick={handleRestartReviewOnly}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <RotateCw className="w-4 h-4" />
              <span>Revoir les expressions non maîtrisées ({reviewCount})</span>
            </button>
          )}

          <button
            onClick={handleRestartAll}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Recommencer tout le paquet</span>
          </button>

          <button
            onClick={handleExportAnkiTSV}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-xs flex items-center justify-center gap-2 border border-slate-800 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Exporter pour Anki / Quizlet (.tsv)</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-5 pb-12">
      {/* Import Notification Banner */}
      {importNotification && (
        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{importNotification}</span>
        </div>
      )}

      {/* Top Controls: Source, Filter, Mode & Multi-Import */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Flashcards de Prononciation Orale
              </h2>
              <p className="text-[11px] text-slate-400">
                Priorité à l'oralité, aux tons et à l'écoute (sans écriture thaïe complexe)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap sm:flex-nowrap">
            {/* Import up to 5 sheets button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-1.5 px-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold flex items-center gap-1.5 border border-amber-500/30 transition cursor-pointer"
              title="Importer jusqu'à 5 fiches (.txt) pour enrichir vos flashcards"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Importer fiches (max 5)</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.json"
              onChange={handleFilesSelected}
              className="hidden"
            />

            <button
              onClick={handleShuffle}
              className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
              title="Mélanger l'ordre des cartes"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
              <span>Mélanger</span>
            </button>

            <button
              onClick={handleExportAnkiTSV}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition cursor-pointer"
              title="Exporter vers Anki (.tsv)"
            >
              <Download className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
            </button>
          </div>
        </div>

        {/* Source selector & Mode switcher */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Conversation source
            </label>
            <select
              value={selectedSheetId}
              onChange={(e) => {
                setSelectedSheetId(e.target.value);
                setCurrentIndex(0);
                setIsFlipped(false);
                setIsCompleted(false);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">Toutes les conversations ({sheets.length})</option>
              {sheets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.expressions.length} expr.)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Sens d'apprentissage oral
            </label>
            <button
              onClick={() => {
                setPracticeMode((prev) => (prev === 'oral_to_fr' ? 'fr_to_oral' : 'oral_to_fr'));
                setIsFlipped(false);
              }}
              className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 font-semibold flex items-center justify-between transition cursor-pointer"
            >
              <span>
                {practiceMode === 'oral_to_fr' ? '🗣️ Prononciation ➔ 🇫🇷 Sens' : '🇫🇷 Sens ➔ 🗣️ Prononciation'}
              </span>
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
        </div>

        {/* Quick context tags filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
          <span className="text-slate-500 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Thème :
          </span>
          <button
            onClick={() => {
              setContextFilter('all');
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`py-1 px-2.5 rounded-lg font-medium shrink-0 transition cursor-pointer ${
              contextFilter === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Toutes
          </button>
          <button
            onClick={() => {
              setContextFilter('demande');
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`py-1 px-2.5 rounded-lg font-medium shrink-0 transition cursor-pointer ${
              contextFilter === 'demande'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Demandes
          </button>
          <button
            onClick={() => {
              setContextFilter('question');
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`py-1 px-2.5 rounded-lg font-medium shrink-0 transition cursor-pointer ${
              contextFilter === 'question'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Questions
          </button>
          <button
            onClick={() => {
              setContextFilter('accord');
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`py-1 px-2.5 rounded-lg font-medium shrink-0 transition cursor-pointer ${
              contextFilter === 'accord'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Accords
          </button>
          <button
            onClick={() => {
              setContextFilter('salutation');
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`py-1 px-2.5 rounded-lg font-medium shrink-0 transition cursor-pointer ${
              contextFilter === 'salutation'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Salutations
          </button>
        </div>
      </div>

      {/* Progress Header & Counter */}
      <div className="flex items-center justify-between px-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-white">
            Carte {currentIndex + 1} / {allCards.length}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
            {currentCard?.sourceSheetTitle}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> {masteredIds.size}
          </span>
          <span className="flex items-center gap-1 text-amber-400 font-semibold">
            <Flame className="w-3.5 h-3.5" /> {reviewIds.size}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / allCards.length) * 100}%` }}
        />
      </div>

      {/* THE FLASHCARD (Front or Back) — STRICTLY FOCUSED ON PRONUNCIATION, NO THAI SCRIPT */}
      {currentCard && (
        <div
          onClick={handleFlip}
          className="relative min-h-[330px] sm:min-h-[360px] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl transition-all cursor-pointer group select-none"
        >
          {/* Top card metadata */}
          <div className="flex items-center justify-between text-xs">
            <span className="px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] font-semibold text-amber-300">
              {currentCard.context}
            </span>

            <span className="text-[11px] text-slate-500 font-mono">
              {isFlipped ? 'Verso (Réponse)' : 'Recto (Question)'} • Cliquez pour tourner
            </span>
          </div>

          {/* Card Body */}
          <div className="my-auto py-6 text-center space-y-4">
            {!isFlipped ? (
              /* RECTO */
              practiceMode === 'oral_to_fr' ? (
                /* Mode 1: Oral Pronunciation -> French */
                <div className="space-y-4">
                  <div className="inline-flex items-center justify-center gap-3">
                    {/* Big Prominent Phonetic RTGS */}
                    <span className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-300 tracking-wide drop-shadow-sm">
                      {currentCard.phonetic}
                    </span>

                    {/* Audio button to listen to native pronunciation */}
                    <button
                      onClick={(e) => handlePlayAudio(currentCard.phonetic || currentCard.thai, e)}
                      className={`p-2.5 rounded-xl border transition cursor-pointer shadow-md ${
                        playingAudio
                          ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
                      }`}
                      title="Écouter la prononciation authentique"
                    >
                      <Volume2 className="w-5 h-5 text-amber-400" />
                    </button>
                  </div>

                  {/* French Pronunciation with Tones */}
                  <div className="inline-block bg-slate-950/90 border border-amber-500/30 py-2 px-4 rounded-2xl text-xs space-y-0.5">
                    <span className="text-slate-400 text-[11px] block">Prononciation guidée (avec tons) :</span>
                    <strong className="text-amber-300 text-sm font-semibold tracking-wide block">
                      {currentCard.pronunciationFr}
                    </strong>
                  </div>

                  <p className="text-xs text-slate-500 pt-1">
                    Quel est le sens de cette expression orale en français ?
                  </p>
                </div>
              ) : (
                /* Mode 2: French -> Oral Pronunciation */
                <div className="space-y-3">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
                    Comment dit-on à l'oral :
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                    « {currentCard.french} »
                  </h3>
                  <p className="text-xs text-slate-400 pt-1">
                    Contexte d'usage : <strong className="text-amber-300">{currentCard.context}</strong>
                  </p>
                  <p className="text-xs text-slate-500 pt-2 italic">
                    Pensez ou prononcez l'expression à voix haute avec ses tons...
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFlipped(true);
                        handlePlayAudio(currentCard.phonetic || currentCard.thai);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-semibold text-xs border border-amber-500/30 transition cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Afficher & écouter la prononciation</span>
                    </button>
                  </div>
                </div>
              )
            ) : (
              /* VERSO (Full Answer Reveal) — NO THAI SCRIPT */
              <div className="space-y-4 animate-fadeIn">
                {/* Audio + Main Pronunciation Front & Center */}
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-300">
                    {currentCard.phonetic}
                  </span>
                  <button
                    onClick={(e) => handlePlayAudio(currentCard.phonetic || currentCard.thai, e)}
                    className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition cursor-pointer shadow-md"
                    title="Réécouter la prononciation"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Phonetics & Tones Callout */}
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-amber-500/30 max-w-sm mx-auto space-y-1">
                  <div className="text-xs text-slate-400">Prononciation française guidée :</div>
                  <div className="text-sm font-bold text-amber-200">
                    {currentCard.pronunciationFr}
                  </div>
                </div>

                {/* French Meaning */}
                <div className="text-xl font-extrabold text-white">
                  👉 {currentCard.french}
                </div>

                {/* Practical Example in French if present */}
                {currentCard.exampleFrench && (
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60 max-w-sm mx-auto text-xs text-left space-y-1">
                    <span className="text-slate-400 text-[11px] block">Exemple pratique en situation :</span>
                    <p className="text-slate-200 font-medium">
                      « {currentCard.exampleFrench} »
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Flip hint */}
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-center gap-2 text-xs font-semibold text-amber-400">
            <RotateCw className="w-3.5 h-3.5" />
            <span>{isFlipped ? 'Cliquez pour retourner la carte' : 'Cliquez pour révéler la réponse'}</span>
          </div>
        </div>
      )}

      {/* Answer & Self-Assessment Action Bar */}
      <div className="space-y-3">
        {!isFlipped ? (
          <button
            onClick={handleFlip}
            className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
            <span>Révéler la réponse</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleMarkReview}
              className="py-3.5 px-4 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 active:scale-[0.98] text-rose-300 font-bold text-xs flex items-center justify-center gap-2 border border-rose-500/30 transition cursor-pointer"
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>À revoir (À répéter)</span>
            </button>

            <button
              onClick={handleMarkMastered}
              className="py-3.5 px-4 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 active:scale-[0.98] text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 border border-emerald-500/40 transition cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Maîtrisé ! (Suivant)</span>
            </button>
          </div>
        )}

        {/* Card Navigation Footer */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-800 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Précédente</span>
          </button>

          <button
            onClick={handleNext}
            className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-800 transition cursor-pointer"
          >
            <span>Passer</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
