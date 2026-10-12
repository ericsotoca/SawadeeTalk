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
  Search,
} from 'lucide-react';
import { StudySheet, WordItem, ExpressionItem } from '../types';
import { downloadSheetAsTxt, formatStudySheetToText } from '../utils/exportText';
import { playThaiAudio } from '../utils/thaiSpeech';
import { removeThaiScript } from '../utils/thaiSanitizer';
import { PronunciationModal } from './PronunciationModal';

interface StudySheetViewProps {
  sheet: StudySheet;
  onNewRecording?: () => void;
}

export const StudySheetView: React.FC<StudySheetViewProps> = ({
  sheet,
  onNewRecording,
}) => {
  const [copied, setCopied] = useState(false);
  const [playingText, setPlayingText] = useState<string | null>(null);

  // Pronunciation modal state (Click on French words)
  const [isPronunciationModalOpen, setIsPronunciationModalOpen] = useState(false);
  const [pronunciationQuery, setPronunciationQuery] = useState('');

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

  const handlePlayAudio = (phoneticText: string) => {
    const clean = removeThaiScript(phoneticText);
    setPlayingText(clean);
    playThaiAudio(clean, () => {
      setPlayingText(null);
    });
  };

  const handleOpenPronunciation = (frenchText: string) => {
    setPronunciationQuery(frenchText);
    setIsPronunciationModalOpen(true);
  };

  // Render clickable interactive words in summary
  const renderInteractiveSummary = (summaryText: string) => {
    const tokens = summaryText.split(/(\s+|[,.;:!?«»"()]+)/);
    return tokens.map((token, i) => {
      const trimmed = token.trim();
      const isWord = trimmed.length > 1 && !/^[,.;:!?«»"()]+$/.test(trimmed);
      if (!isWord) {
        return <span key={i}>{token}</span>;
      }
      return (
        <span
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            handleOpenPronunciation(trimmed);
          }}
          className="cursor-pointer hover:text-amber-300 hover:bg-amber-500/25 px-0.5 rounded transition inline-block underline decoration-dotted decoration-amber-500/50"
          title={`Cliquer pour afficher la prononciation de « ${trimmed} »`}
        >
          {token}
        </span>
      );
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
                Fiche Validée (100% Phonétique Orale)
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
              {sheet.dateFormatted} • Aucune écriture thaïlandaise • Phonétique latine & tons pour francophones
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
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-[0.98] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>EXPORTER EN TEXTE (.txt)</span>
          </button>

          {/* Quick Pronunciation Launcher button */}
          <button
            onClick={() => handleOpenPronunciation('')}
            className="py-3 px-4 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 border border-amber-500/40 transition cursor-pointer"
            title="Afficher et écouter la prononciation au clic sur n'importe quel mot"
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>Prononciation au clic</span>
          </button>

          <button
            onClick={handleCopy}
            className="py-3 px-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:scale-[0.98] text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
            title="Copier toute la fiche dans le presse-papiers"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">Copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copier</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SECTION : RÉSUMÉ & POINTS CLÉS DE LA CONVERSATION */}
      {(sheet.summary || (sheet.keyPoints && sheet.keyPoints.length > 0)) && (
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  Synthèse & Résumé de la conversation
                </h2>
                <p className="text-xs text-slate-400">
                  Extraction contextuelle et points clés de l'échange réel
                </p>
              </div>
            </div>

            {/* Click-to-pronounce badge hint */}
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
              <Volume2 className="w-3.5 h-3.5" />
              Clic = Prononciation
            </span>
          </div>

          {/* Interactive Hint Banner */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-center justify-between gap-2 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Prononciation interactive :</strong> Cliquez sur n'importe quel mot ou phrase en français pour afficher sa prononciation orale et l'écouter.
              </span>
            </div>
          </div>

          {/* French Summary Paragraph with Interactive Clickable Words */}
          {sheet.summary && (
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">
                  Résumé analytique de la discussion :
                </span>
                <span className="text-[11px] text-amber-300/90 font-medium flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  <Volume2 className="w-3 h-3 text-amber-400" />
                  Cliquez sur un mot français pour la prononciation
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                {renderInteractiveSummary(sheet.summary)}
              </p>
            </div>
          )}

          {/* Déroulé & Temps forts chronologiques */}
          {sheet.discussionHighlights && sheet.discussionHighlights.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-orange-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                Déroulé & Temps forts de l'échange :
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sheet.discussionHighlights.map((dh, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleOpenPronunciation(dh)}
                    className="flex items-start gap-2.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-orange-500/30 p-3 rounded-xl text-xs text-slate-300 transition cursor-pointer group"
                    title="Cliquez pour afficher et écouter la prononciation des termes de cette étape"
                  >
                    <span className="w-5 h-5 rounded-lg bg-orange-500/15 text-orange-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed text-slate-200">{dh}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Quick-Access Words from this conversation */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
              Mots français de la conversation (cliquez pour afficher la prononciation) :
            </span>
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {sheet.words.map((w, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOpenPronunciation(w.french)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 text-xs font-medium transition cursor-pointer flex items-center gap-1.5 group"
                  title={`Voir et écouter la prononciation de « ${w.french} »`}
                >
                  <span>{w.french.split('/')[0].split('(')[0].trim()}</span>
                  <Volume2 className="w-3 h-3 text-slate-400 group-hover:text-amber-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Key Points */}
          {sheet.keyPoints && sheet.keyPoints.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                Points clés essentiels :
              </span>
              <div className="grid grid-cols-1 gap-2">
                {sheet.keyPoints.map((kp, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleOpenPronunciation(kp)}
                    className="flex items-start justify-between gap-2.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/70 hover:border-amber-500/30 p-3 rounded-xl text-xs text-slate-300 transition cursor-pointer group"
                    title="Cliquez pour chercher la prononciation des termes de ce point clé"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-lg bg-amber-500/10 text-amber-400 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed text-slate-200">{kp}</span>
                    </div>
                    <Volume2 className="w-4 h-4 text-slate-400 group-hover:text-amber-400 shrink-0 mt-0.5" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
                  Mots oraux distincts
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
                  {sheet.stats.top5Words.map((item, idx) => {
                    const cleanPhonetic = removeThaiScript(item.phonetic || item.thai);
                    return (
                      <div
                        key={idx}
                        onClick={() => handleOpenPronunciation(item.french)}
                        className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 hover:border-amber-500/30 border border-transparent transition cursor-pointer group"
                        title="Cliquez pour afficher et écouter la prononciation"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="font-mono text-slate-500 font-semibold w-4">
                            {idx + 1}.
                          </span>
                          <span className="font-bold text-amber-300 font-mono">
                            {cleanPhonetic}
                          </span>
                          <span className="text-slate-300 text-[11px] truncate">
                            ({item.french})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-bold text-amber-400 text-[11px] px-2 py-0.5 rounded bg-amber-500/10">
                            {item.count}×
                          </span>
                          <Volume2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top 5 Expressions */}
              <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/80 space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-orange-300 flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5" />
                  Top 5 Expressions les plus fréquentes
                </h3>
                <div className="space-y-2">
                  {sheet.stats.top5Expressions.map((item, idx) => {
                    const cleanPhonetic = removeThaiScript(item.phonetic || item.thai);
                    return (
                      <div
                        key={idx}
                        onClick={() => handleOpenPronunciation(item.french)}
                        className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 hover:border-orange-500/30 border border-transparent transition cursor-pointer group"
                        title="Cliquez pour afficher et écouter la prononciation"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="font-mono text-slate-500 font-semibold w-4">
                            {idx + 1}.
                          </span>
                          <span className="font-bold text-orange-300 font-mono truncate">
                            {cleanPhonetic}
                          </span>
                          <span className="text-slate-300 text-[11px] truncate">
                            ({item.french})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-bold text-orange-400 text-[11px] px-2 py-0.5 rounded bg-orange-500/10">
                            {item.count}×
                          </span>
                          <Volume2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {sheet.stats.segmentationNote && (
              <div className="text-[11px] text-slate-400 flex items-start gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>{removeThaiScript(sheet.stats.segmentationNote)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 1 : LES MOTS LES PLUS UTILISÉS (PHONÉTIQUE & TONS) */}
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
                  Section 1 : Les mots oraux les plus utilisés
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-bold font-mono">
                  {sheet.words.length}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Phonétique romanisée, tons précis et écoute vocale
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
              {sheet.words.map((word, idx) => {
                const cleanWordPhonetic = removeThaiScript(word.phonetic || word.thai);
                return (
                  <div
                    key={idx}
                    className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 hover:border-slate-700 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Phonetic word in prominent bold Latin font */}
                          <span className="text-2xl font-extrabold font-mono text-amber-300">
                            {cleanWordPhonetic}
                          </span>

                          {/* Pronounce button */}
                          <button
                            onClick={() => handlePlayAudio(cleanWordPhonetic)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              playingText === cleanWordPhonetic
                                ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            }`}
                            title="Écouter la prononciation"
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
                          <span className="text-slate-400 italic">
                            Prononciation : <strong className="text-amber-200 font-medium">{word.pronunciationFr}</strong>
                          </span>
                          {word.tone && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400/90 font-medium">
                              {word.tone}
                            </span>
                          )}
                        </div>

                        {/* Clickable French Translation */}
                        <div className="pt-1">
                          <button
                            onClick={() => handleOpenPronunciation(word.french)}
                            className="text-left group/fr inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-amber-300 transition cursor-pointer"
                            title="Cliquez pour afficher et écouter la prononciation"
                          >
                            <span>👉 {word.french}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-normal border border-amber-500/30 group-hover/fr:bg-amber-500 group-hover/fr:text-slate-950 transition">
                              🔊 Prononciation au clic
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Occurrence count pill */}
                      <div className="shrink-0 text-right">
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          {word.occurrences} fois
                        </span>
                      </div>
                    </div>

                    {/* Contextual example if available */}
                    {word.exampleThai && (
                      <div className="mt-3 pt-3 border-t border-slate-800/60 bg-slate-900/40 p-2.5 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-200 font-mono font-medium">
                            {removeThaiScript(word.exampleThai)}
                          </span>
                          <button
                            onClick={() => handlePlayAudio(word.exampleThai)}
                            className="text-slate-400 hover:text-amber-300 p-1 cursor-pointer"
                            title="Écouter l'exemple"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p
                          onClick={() => handleOpenPronunciation(word.exampleFrench)}
                          className="text-slate-400 hover:text-amber-300 text-[11px] italic cursor-pointer transition"
                          title="Cliquez pour écouter"
                        >
                          {word.exampleFrench}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2 : LES EXPRESSIONS LES PLUS UTILISÉES */}
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
                  Section 2 : Les expressions les plus utiles
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
              {filteredExpressions.map((exp, idx) => {
                const cleanExpPhonetic = removeThaiScript(exp.phonetic || exp.thai);
                return (
                  <div
                    key={idx}
                    className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 hover:border-slate-700 transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-xl font-extrabold font-mono text-orange-300">
                            {cleanExpPhonetic}
                          </span>

                          <button
                            onClick={() => handlePlayAudio(cleanExpPhonetic)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              playingText === cleanExpPhonetic
                                ? 'bg-orange-500 text-white border-orange-400 animate-pulse'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            }`}
                            title="Écouter l'expression"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className="text-slate-400 italic">
                            Prononciation : <strong className="text-orange-200 font-medium">{exp.pronunciationFr}</strong>
                          </span>
                        </div>

                        {/* Clickable French Translation */}
                        <div className="pt-0.5">
                          <button
                            onClick={() => handleOpenPronunciation(exp.french)}
                            className="text-left group/fr inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-orange-300 transition cursor-pointer"
                            title="Cliquez pour afficher et écouter la prononciation"
                          >
                            <span>👉 {exp.french}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 font-normal border border-orange-500/30 group-hover/fr:bg-orange-500 group-hover/fr:text-white transition">
                              🔊 Prononciation
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/30">
                          {exp.occurrences} fois
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
                          <span className="text-slate-200 font-mono font-medium">
                            {removeThaiScript(exp.exampleThai)}
                          </span>
                          <button
                            onClick={() => handlePlayAudio(exp.exampleThai)}
                            className="text-slate-400 hover:text-orange-300 p-1 cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p
                          onClick={() => handleOpenPronunciation(exp.exampleFrench)}
                          className="text-slate-400 hover:text-orange-300 text-[11px] italic cursor-pointer transition"
                        >
                          {exp.exampleFrench}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3 : LES STRUCTURES LINGUISTIQUES */}
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
                  Section 3 : Les structures orales à retenir
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
                    <span className="text-base font-bold font-mono text-teal-300">
                      {removeThaiScript(structure.structureThai)}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      Modèle #{idx + 1}
                    </span>
                  </div>

                  <p
                    onClick={() => handleOpenPronunciation(structure.meaningFrench)}
                    className="text-xs font-semibold text-white hover:text-teal-300 cursor-pointer transition flex items-center gap-2"
                  >
                    <span>Signification : <span className="text-teal-200">{structure.meaningFrench}</span></span>
                    <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                  </p>

                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60">
                    💡 <strong className="text-slate-300">Règle :</strong> {structure.grammarExplanation}
                  </p>

                  {/* Reusable example */}
                  <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200 font-mono">
                        Exemple modèle : {removeThaiScript(structure.exampleThai)}
                      </span>
                      <button
                        onClick={() => handlePlayAudio(structure.exampleThai)}
                        className="text-slate-400 hover:text-teal-300 p-1 cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p
                      onClick={() => handleOpenPronunciation(structure.exampleFrench)}
                      className="text-[11px] text-slate-400 hover:text-teal-300 italic cursor-pointer transition"
                    >
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
                  Section 4 : Particules orales et politesse
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-purple-400 font-bold font-mono">
                  {sheet.particles.length}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Politesse (khrap/kha), marqueurs de question et accord oral
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
              {sheet.particles.map((particle, idx) => {
                const cleanParticlePhonetic = removeThaiScript(particle.phonetic || particle.thai);
                return (
                  <div
                    key={idx}
                    className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 hover:border-slate-700 transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold font-mono text-purple-300">
                          {cleanParticlePhonetic}
                        </span>
                        <button
                          onClick={() => handlePlayAudio(cleanParticlePhonetic)}
                          className="text-slate-400 hover:text-purple-300 p-1 cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                        {particle.category}
                      </span>
                    </div>

                    <p
                      onClick={() => handleOpenPronunciation(particle.role)}
                      className="text-xs text-slate-300 hover:text-purple-200 cursor-pointer transition"
                    >
                      <strong className="text-slate-100">Rôle :</strong> {particle.role}
                    </p>

                    <div className="text-[11px] text-amber-300/80 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                      ⚠️ {particle.speakerRegister}
                    </div>

                    {particle.exampleUsage && (
                      <div className="text-[11px] text-slate-400 italic">
                        Exemple oral : {removeThaiScript(particle.exampleUsage)}
                      </div>
                    )}
                  </div>
                );
              })}
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
            {removeThaiScript(sheet.pedagogicalAdvice)}
          </p>
        </div>
      )}

      {/* Bottom Sticky-like Export Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl">
        <div className="text-center sm:text-left">
          <span className="text-xs font-semibold text-slate-200 block">
            Fiche prête pour révision nomade (100% sans écriture thaïe)
          </span>
          <span className="text-[11px] text-slate-400">
            Fichier texte UTF-8 en phonétique latine avec tons.
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

      {/* Click-to-Pronounce Interactive Modal */}
      <PronunciationModal
        isOpen={isPronunciationModalOpen}
        onClose={() => setIsPronunciationModalOpen(false)}
        sheet={sheet}
        initialSearch={pronunciationQuery}
      />
    </div>
  );
};
