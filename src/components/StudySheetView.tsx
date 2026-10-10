import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  Volume2,
  ChevronDown,
  ChevronUp,
  BarChart3,
  BookOpen,
  MessageSquare,
  Sparkles,
  Layers,
  HelpCircle,
  Clock,
  Hash,
  Repeat,
  Info,
  GraduationCap,
} from 'lucide-react';
import { StudySheet, ExpressionItem } from '../types';
import { downloadSheetAsTxt, formatStudySheetToText } from '../utils/exportText';
import { playThaiAudio } from '../utils/thaiSpeech';

interface StudySheetViewProps {
  sheet: StudySheet;
  onNewRecording?: () => void;
  onOpenFlashcards?: () => void;
}

export const StudySheetView: React.FC<StudySheetViewProps> = ({
  sheet,
  onNewRecording,
  onOpenFlashcards,
}) => {
  const [copied, setCopied] = useState(false);
  const [playingText, setPlayingText] = useState<string | null>(null);

  // Accordion section states
  const [openSections, setOpenSections] = useState<{
    stats: boolean;
    words: boolean;
    expressions: boolean;
    structures: boolean;
    particles: boolean;
  }>({
    stats: true,
    words: true,
    expressions: true,
    structures: true,
    particles: true,
  });

  // Expression filter state
  const [expressionFilter, setExpressionFilter] = useState<string>('all');

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopy = async () => {
    try {
      const fullText = formatStudySheetToText(sheet);
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn("Échec de copie:", err);
    }
  };

  const handlePlayAudio = (thaiText: string) => {
    setPlayingText(thaiText);
    playThaiAudio(thaiText, () => {
      setPlayingText(null);
    });
  };

  // Filtered expressions
  const filteredExpressions = sheet.expressions.filter((exp) => {
    if (expressionFilter === 'all') return true;
    return exp.contextTag === expressionFilter;
  });

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-12">
      {/* Title & Metadata Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 uppercase tracking-wider">
                Fiche Validée
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {sheet.stats.durationFormatted}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {sheet.title}
            </h1>
            <p className="text-xs text-slate-400">
              {sheet.dateFormatted} • Respect strict de la confidentialité (aucun dialogue transcrit)
            </p>
          </div>

          {onNewRecording && (
            <button
              onClick={onNewRecording}
              className="self-start sm:self-center py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer shrink-0"
            >
              Nouvel enregistrement
            </button>
          )}
        </div>

        {/* Primary Export Action Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={() => downloadSheetAsTxt(sheet)}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>EXPORTER MA FICHE EN TEXTE (.txt UTF-8)</span>
          </button>

          {onOpenFlashcards && sheet.expressions.length > 0 && (
            <button
              onClick={onOpenFlashcards}
              className="py-3 px-4 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 active:scale-[0.98] text-amber-300 font-semibold text-xs flex items-center justify-center gap-2 border border-amber-500/30 transition cursor-pointer shadow-sm"
              title="Pratiquer ces expressions sous forme de flashcards interactives"
            >
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span>Flashcards ({sheet.expressions.length})</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="py-3 px-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:scale-[0.98] text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
            title="Copier toute la fiche dans le presse-papiers"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">Fiche copiée !</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copier la fiche</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SECTION : STATISTIQUES DE LA CONVERSATION */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-lg transition">
        <button
          onClick={() => toggleSection('stats')}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-800/40 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Statistiques de la conversation
              </h2>
              <p className="text-xs text-slate-400">
                Calculs réels issus de la segmentation linguistique
              </p>
            </div>
          </div>
          {openSections.stats ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {openSections.stats && (
          <div className="p-5 sm:p-6 pt-0 border-t border-slate-800/60 space-y-6">
            {/* Key counts grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4">
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                  Mots parlés (approx)
                </span>
                <span className="text-xl font-bold font-mono text-white">
                  {sheet.stats.totalSpokenWordsApprox}
                </span>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                  Mots thaïs distincts
                </span>
                <span className="text-xl font-bold font-mono text-amber-400">
                  {sheet.stats.distinctThaiWords}
                </span>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                  Expressions distinctes
                </span>
                <span className="text-xl font-bold font-mono text-orange-400">
                  {sheet.stats.distinctThaiExpressions}
                </span>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                  Expressions répétées
                </span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {sheet.stats.repeatedExpressionsCount}
                </span>
              </div>
            </div>

            {/* Top 5 Words & Expressions Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Top 5 Words */}
              <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/80 space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" />
                  Top 5 Mots les plus fréquents
                </h3>
                <div className="space-y-2">
                  {sheet.stats.top5Words.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-900/60"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="font-mono text-slate-500 font-semibold w-4">
                          {idx + 1}.
                        </span>
                        <span className="font-semibold text-slate-100 font-['Sarabun']">
                          {item.thai}
                        </span>
                        <span className="text-slate-400 text-[11px] truncate">
                          ({item.french})
                        </span>
                      </div>
                      <span className="font-mono font-bold text-amber-400 text-[11px] shrink-0 px-2 py-0.5 rounded bg-amber-500/10">
                        {item.count}×
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top 5 Expressions */}
              <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/80 space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-orange-300 flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5" />
                  Top 5 Expressions les plus fréquentes
                </h3>
                <div className="space-y-2">
                  {sheet.stats.top5Expressions.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-900/60"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="font-mono text-slate-500 font-semibold w-4">
                          {idx + 1}.
                        </span>
                        <span className="font-semibold text-slate-100 font-['Sarabun'] truncate">
                          {item.thai}
                        </span>
                        <span className="text-slate-400 text-[11px] truncate">
                          ({item.french})
                        </span>
                      </div>
                      <span className="font-mono font-bold text-orange-400 text-[11px] shrink-0 px-2 py-0.5 rounded bg-orange-500/10">
                        {item.count}×
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {sheet.stats.segmentationNote && (
              <div className="text-[11px] text-slate-400 flex items-start gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>{sheet.stats.segmentationNote}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 1 : LES MOTS THAÏS LES PLUS UTILISÉS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-lg transition">
        <button
          onClick={() => toggleSection('words')}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-800/40 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Section 1 : Les mots thaïs les plus utilisés
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-bold font-mono">
                  {sheet.words.length}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Classés par fréquence réelle décroissante, translittération et tons
              </p>
            </div>
          </div>
          {openSections.words ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {openSections.words && (
          <div className="p-5 sm:p-6 pt-0 border-t border-slate-800/60 space-y-3">
            <div className="grid grid-cols-1 gap-3 pt-3">
              {sheet.words.map((word, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Thai word with big font */}
                        <span className="text-2xl font-bold font-['Sarabun'] text-amber-300">
                          {word.thai}
                        </span>

                        {/* Pronounce button */}
                        <button
                          onClick={() => handlePlayAudio(word.thai)}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            playingText === word.thai
                              ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          }`}
                          title="Écouter la prononciation thaïe"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>

                        {/* Category badge */}
                        {word.category && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                            {word.category}
                          </span>
                        )}
                      </div>

                      {/* Phonetic & French pronunciation with tones */}
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-mono text-slate-300 font-medium">
                          {word.phonetic}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400 italic">
                          Prononciation : <strong className="text-amber-200/90 font-medium">{word.pronunciationFr}</strong>
                        </span>
                        {word.tone && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400/90">
                            {word.tone}
                          </span>
                        )}
                      </div>

                      {/* French translation */}
                      <p className="text-sm font-semibold text-white pt-1">
                        👉 {word.french}
                      </p>
                    </div>

                    {/* Occurrence count pill */}
                    <div className="shrink-0 text-right">
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        {word.occurrences} {word.occurrences > 1 ? 'fois' : 'fois'}
                      </span>
                    </div>
                  </div>

                  {/* Contextual example if available */}
                  {word.exampleThai && (
                    <div className="mt-3 pt-3 border-t border-slate-800/60 bg-slate-900/40 p-2.5 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-200 font-['Sarabun'] font-medium">
                          {word.exampleThai}
                        </span>
                        <button
                          onClick={() => handlePlayAudio(word.exampleThai)}
                          className="text-slate-400 hover:text-amber-300 p-1 cursor-pointer"
                          title="Écouter l'exemple"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-slate-400 text-[11px] italic">
                        {word.exampleFrench}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2 : LES EXPRESSIONS THAÏES LES PLUS UTILISÉES */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-lg transition">
        <button
          onClick={() => toggleSection('expressions')}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-800/40 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Section 2 : Les expressions thaïes les plus utilisées
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-orange-400 font-bold font-mono">
                  {sheet.expressions.length}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Expressions du quotidien, contextes réels et exemples pratiques
              </p>
            </div>
          </div>
          {openSections.expressions ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {openSections.expressions && (
          <div className="p-5 sm:p-6 pt-0 border-t border-slate-800/60 space-y-4">
            {/* Quick Filter buttons */}
            <div className="pt-3 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <button
                onClick={() => setExpressionFilter('all')}
                className={`py-1.5 px-3 rounded-xl font-medium shrink-0 transition cursor-pointer ${
                  expressionFilter === 'all'
                    ? 'bg-orange-500 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Toutes ({sheet.expressions.length})
              </button>
              <button
                onClick={() => setExpressionFilter('salutation')}
                className={`py-1.5 px-3 rounded-xl font-medium shrink-0 transition cursor-pointer ${
                  expressionFilter === 'salutation'
                    ? 'bg-orange-500 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Salutations & Politesse
              </button>
              <button
                onClick={() => setExpressionFilter('question')}
                className={`py-1.5 px-3 rounded-xl font-medium shrink-0 transition cursor-pointer ${
                  expressionFilter === 'question'
                    ? 'bg-orange-500 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Questions & Prix
              </button>
              <button
                onClick={() => setExpressionFilter('accord')}
                className={`py-1.5 px-3 rounded-xl font-medium shrink-0 transition cursor-pointer ${
                  expressionFilter === 'accord'
                    ? 'bg-orange-500 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Accords & Réponses
              </button>
              <button
                onClick={() => setExpressionFilter('demande')}
                className={`py-1.5 px-3 rounded-xl font-medium shrink-0 transition cursor-pointer ${
                  expressionFilter === 'demande'
                    ? 'bg-orange-500 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Demandes & Commandes
              </button>
            </div>

            {/* Expressions List */}
            <div className="space-y-3">
              {filteredExpressions.map((exp, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 hover:border-slate-700 transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xl font-bold font-['Sarabun'] text-orange-300">
                          {exp.thai}
                        </span>

                        <button
                          onClick={() => handlePlayAudio(exp.thai)}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            playingText === exp.thai
                              ? 'bg-orange-500 text-white border-orange-400 animate-pulse'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          }`}
                          title="Écouter l'expression"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-mono text-slate-300">
                          {exp.phonetic}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400 italic">
                          Prononciation : <strong className="text-orange-200/90 font-medium">{exp.pronunciationFr}</strong>
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-white pt-0.5">
                        👉 {exp.french}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/30">
                        {exp.occurrences} {exp.occurrences > 1 ? 'fois' : 'fois'}
                      </span>
                    </div>
                  </div>

                  {/* Context note */}
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Contexte d'emploi : <strong className="text-slate-200 font-medium">{exp.context}</strong>
                    </span>
                  </div>

                  {/* Practical memorization example */}
                  {exp.exampleThai && (
                    <div className="bg-slate-900/40 p-2.5 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-200 font-['Sarabun'] font-medium">
                          {exp.exampleThai}
                        </span>
                        <button
                          onClick={() => handlePlayAudio(exp.exampleThai)}
                          className="text-slate-400 hover:text-orange-300 p-1 cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-slate-400 text-[11px] italic">
                        {exp.exampleFrench}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3 : LES STRUCTURES LINGUISTIQUES À RETENIR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-lg transition">
        <button
          onClick={() => toggleSection('structures')}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-800/40 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Section 3 : Les structures linguistiques à retenir
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-teal-400 font-bold font-mono">
                  {sheet.structures.length}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Formules et patrons de phrases faciles à réutiliser
              </p>
            </div>
          </div>
          {openSections.structures ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {openSections.structures && (
          <div className="p-5 sm:p-6 pt-0 border-t border-slate-800/60 space-y-3">
            <div className="grid grid-cols-1 gap-3 pt-3">
              {sheet.structures.map((structure, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 hover:border-slate-700 transition space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold font-['Sarabun'] text-teal-300">
                      {structure.structureThai}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      Modèle #{idx + 1}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-white">
                    Signification : <span className="text-teal-200">{structure.meaningFrench}</span>
                  </p>

                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60">
                    💡 <strong className="text-slate-300">Règle :</strong> {structure.grammarExplanation}
                  </p>

                  {/* Reusable example */}
                  <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200 font-['Sarabun']">
                        Exemple modèle : {structure.exampleThai}
                      </span>
                      <button
                        onClick={() => handlePlayAudio(structure.exampleThai)}
                        className="text-slate-400 hover:text-teal-300 p-1 cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 italic">
                      Traduction : {structure.exampleFrench}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4 : PARTICULES ET MOTS DE LIAISON */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-lg transition">
        <button
          onClick={() => toggleSection('particles')}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-800/40 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Section 4 : Mots de liaison et particules thaïes
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-purple-400 font-bold font-mono">
                  {sheet.particles.length}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Politesse (ครับ/ค่ะ), marqueurs de question, accord et naturel
              </p>
            </div>
          </div>
          {openSections.particles ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {openSections.particles && (
          <div className="p-5 sm:p-6 pt-0 border-t border-slate-800/60 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
              {sheet.particles.map((particle, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 hover:border-slate-700 transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold font-['Sarabun'] text-purple-300">
                        {particle.thai}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        ({particle.phonetic})
                      </span>
                    </div>
                    <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      {particle.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    <strong className="text-slate-100">Rôle :</strong> {particle.role}
                  </p>

                  <div className="text-[11px] text-amber-300/80 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    ⚠️ {particle.speakerRegister}
                  </div>

                  {particle.exampleUsage && (
                    <div className="text-[11px] text-slate-400 italic">
                      Exemple : {particle.exampleUsage}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pedagogical Advice Callout if present */}
      {sheet.pedagogicalAdvice && (
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-5 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span>Conseils du linguiste pour vos prochaines conversations</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {sheet.pedagogicalAdvice}
          </p>
        </div>
      )}

      {/* Bottom Sticky-like Export Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl">
        <div className="text-center sm:text-left">
          <span className="text-xs font-semibold text-slate-200 block">
            Fiche prête pour révision nomade
          </span>
          <span className="text-[11px] text-slate-400">
            Fichier texte UTF-8 compatible Android, iOS, Windows et Docs.
          </span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => downloadSheetAsTxt(sheet)}
            className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Télécharger (.txt)
          </button>
          <button
            onClick={handleCopy}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
      </div>
    </div>
  );
};
