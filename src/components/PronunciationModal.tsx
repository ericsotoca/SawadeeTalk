import React, { useState, useEffect, useMemo } from 'react';
import {
  Volume2,
  X,
  Search,
  Sparkles,
  Check,
  ChevronRight,
  BookOpen,
  MessageSquare,
  Repeat,
  Info,
} from 'lucide-react';
import { StudySheet, WordItem, ExpressionItem } from '../types';
import { playThaiAudio } from '../utils/thaiSpeech';
import { removeThaiScript } from '../utils/thaiSanitizer';

// Built-in emergency travel lexicon for instant French-to-Thai pronunciation lookup
const COMMON_FRENCH_LOOKUP: Array<{
  frenchKeywords: string[];
  frenchLabel: string;
  phonetic: string;
  pronunciationFr: string;
  tone: string;
  context: string;
}> = [
  {
    frenchKeywords: ['bonjour', 'salut', 'saluer', 'bonsoir'],
    frenchLabel: 'Bonjour / Salut',
    phonetic: 'sawat-dee khrap / sawat-dee kha',
    pronunciationFr: 'sa-wat-di krap (homme) / ka (femme)',
    tone: 'Tons bas + plat',
    context: 'Formule de salutation universelle avec particule de politesse',
  },
  {
    frenchKeywords: ['merci', 'remercier'],
    frenchLabel: 'Merci beaucoup',
    phonetic: 'khòop-khun khrap / khòop-khun kha',
    pronunciationFr: 'kòp-koun krap / ka',
    tone: 'Ton bas + ton plat',
    context: 'Pour remercier avec déférence et politesse',
  },
  {
    frenchKeywords: ['addition', 'payer', 'compte', 'régler', 'encaisser'],
    frenchLabel: "L'addition s'il vous plaît",
    phonetic: 'gep ngoen duai khrap / chek bin khrap',
    pronunciationFr: 'gèp ngeun douay krap / tchek bin krap',
    tone: 'Ton bas + ton montant',
    context: 'À la fin du repas au restaurant ou café',
  },
  {
    frenchKeywords: ['combien', 'prix', 'coûte', 'coûter', 'tarif'],
    frenchLabel: 'Combien ça coûte ?',
    phonetic: 'thao-rai khrap',
    pronunciationFr: 'tao-raï krap',
    tone: 'Ton descendant + ton bas',
    context: 'Pour demander un tarif au marché, stand ou boutique',
  },
  {
    frenchKeywords: ['épicé', 'piment', 'piquant', 'pimenté'],
    frenchLabel: 'Pas épicé (sans piment)',
    phonetic: 'mai phet khrap',
    pronunciationFr: 'maï pèt krap',
    tone: 'Ton descendant + ton bas',
    context: 'Vital au restaurant thaïlandais pour éviter le piment fort',
  },
  {
    frenchKeywords: ['eau', 'boisson', 'bouteille'],
    frenchLabel: "De l'eau (plate / fraîche)",
    phonetic: 'nam plao / nam yen',
    pronunciationFr: 'nam pla-o / nam yèn',
    tone: 'Ton haut',
    context: 'Pour commander de l\'eau en bouteille',
  },
  {
    frenchKeywords: ['pad thaï', 'nouilles', 'nouille'],
    frenchLabel: 'Pad Thaï (nouilles sautées)',
    phonetic: 'phat-thai',
    pronunciationFr: 'pat-taï',
    tone: 'Ton bas + ton plat',
    context: 'Le plat de nouilles emblématique de Thaïlande',
  },
  {
    frenchKeywords: ['cher', 'coûteux'],
    frenchLabel: "C'est un peu trop cher",
    phonetic: 'phaeng pai nit-noi',
    pronunciationFr: 'pèng paï nit-noï',
    tone: 'Ton plat + descendant',
    context: 'Pour amorcer une négociation polie au marché',
  },
  {
    frenchKeywords: ['baisser', 'réduire', 'rabais', 'réduction', 'prix'],
    frenchLabel: 'Pouvez-vous baisser un peu le prix ?',
    phonetic: 'lot noi dai mai khrap',
    pronunciationFr: 'lott noï daï maï krap',
    tone: 'Ton haut + descendant',
    context: 'Pour demander une remise avec le sourire',
  },
  {
    frenchKeywords: ['d\'accord', 'accord', 'oui', 'possible', 'marché'],
    frenchLabel: "C'est d'accord / Possible / Marché conclu",
    phonetic: 'dai khrap / tok-long',
    pronunciationFr: 'daï krap / tok-long',
    tone: 'Ton descendant',
    context: 'Pour confirmer un accord ou répondre par l\'affirmative',
  },
  {
    frenchKeywords: ['non', 'pas'],
    frenchLabel: 'Ne pas / Non',
    phonetic: 'mai',
    pronunciationFr: 'maï',
    tone: 'Ton descendant',
    context: 'Marqueur de négation devant tout verbe ou adjectif',
  },
  {
    frenchKeywords: ['droite'],
    frenchLabel: 'Tourner à droite',
    phonetic: 'liao khwaa khrap',
    pronunciationFr: 'liao koua krap',
    tone: 'Ton haut + ton montant',
    context: 'Pour guider un taxi ou demander son chemin',
  },
  {
    frenchKeywords: ['gauche'],
    frenchLabel: 'Tourner à gauche',
    phonetic: 'liao saai khrap',
    pronunciationFr: 'liao saï krap',
    tone: 'Ton haut + ton haut',
    context: 'Pour guider un chauffeur',
  },
  {
    frenchKeywords: ['droit', 'continuer'],
    frenchLabel: 'Tout droit',
    phonetic: 'trong-pai khrap',
    pronunciationFr: 'trong-paï krap',
    tone: 'Tons plats',
    context: 'Direction dans la circulation',
  },
  {
    frenchKeywords: ['arrêter', 'stop', 'déposer', 'descendre'],
    frenchLabel: 'Arrêtez-vous ici s\'il vous plaît',
    phonetic: 'jòot trong-nee khrap',
    pronunciationFr: 'tchod trong-ni krap',
    tone: 'Ton bas + ton haut',
    context: 'Pour indiquer au chauffeur de s\'arrêter',
  },
  {
    frenchKeywords: ['compteur', 'taximètre'],
    frenchLabel: 'Mettez le compteur s\'il vous plaît',
    phonetic: 'poet mi-toe duai khrap',
    pronunciationFr: 'peud mi-teur douay krap',
    tone: 'Ton bas + ton montant',
    context: 'Indispensable en montant dans un taxi à Bangkok',
  },
  {
    frenchKeywords: ['commander', 'commande', 'prendre', 'veux', 'vouloir'],
    frenchLabel: 'Je voudrais commander / Je prends',
    phonetic: 'ao... khrap / sang... khrap',
    pronunciationFr: 'ao... krap / sang... krap',
    tone: 'Ton plat',
    context: 'Pour passer commande au restaurant ou au stand',
  },
  {
    frenchKeywords: ['poulet'],
    frenchLabel: 'Poulet',
    phonetic: 'kai',
    pronunciationFr: 'kaï',
    tone: 'Ton bas',
    context: 'Viande très répandue dans les plats thaïlandais',
  },
  {
    frenchKeywords: ['porc'],
    frenchLabel: 'Porc',
    phonetic: 'mou',
    pronunciationFr: 'mou',
    tone: 'Ton montant',
    context: 'Viande courante en street food',
  },
  {
    frenchKeywords: ['crevette', 'crevettes'],
    frenchLabel: 'Crevette(s)',
    phonetic: 'kung',
    pronunciationFr: 'koung',
    tone: 'Ton bas',
    context: 'Classique dans le Pad Thaï et le Tom Yum',
  },
  {
    frenchKeywords: ['bœuf', 'boeuf'],
    frenchLabel: 'Bœuf',
    phonetic: 'nuea',
    pronunciationFr: 'neua',
    tone: 'Ton haut',
    context: 'Viande de bœuf',
  },
  {
    frenchKeywords: ['riz'],
    frenchLabel: 'Riz (nature / sauté)',
    phonetic: 'khao / khao phat',
    pronunciationFr: 'khao / khao pat',
    tone: 'Ton descendant',
    context: 'Base de l\'alimentation thaïlandaise',
  },
  {
    frenchKeywords: ['délicieux', 'bon', 'très bon', 'goût'],
    frenchLabel: "C'est délicieux / Très bon",
    phonetic: 'a-roi maak khrap',
    pronunciationFr: 'a-roï mak krap',
    tone: 'Ton bas + ton descendant',
    context: 'Pour complimenter le cuisinier ou le vendeur',
  },
  {
    frenchKeywords: ['pardon', 'excusez-moi', 'désolé', 's\'il vous plaît'],
    frenchLabel: "Pardon / Excusez-moi",
    phonetic: 'khò-thot khrap / khò-thot kha',
    pronunciationFr: 'kò-tot krap / ka',
    tone: 'Ton descendant + ton haut',
    context: 'Formule d\'excuse ou pour interpeller poliment',
  },
  {
    frenchKeywords: ['toilettes', 'wc', 'bain'],
    frenchLabel: 'Où sont les toilettes ?',
    phonetic: 'hong-nam yuu thee-nai khrap',
    pronunciationFr: 'hong-nam you ti-naï krap',
    tone: 'Tons variés (descendant + montant)',
    context: 'Demande essentielle dans tout établissement',
  },
  {
    frenchKeywords: ['emporter', 'sac'],
    frenchLabel: 'À emporter s\'il vous plaît',
    phonetic: 'sai thung / klap baan khrap',
    pronunciationFr: 'saï toung / klap ban krap',
    tone: 'Ton bas + descendant',
    context: 'Pour demander un repas à emporter',
  },
  {
    frenchKeywords: ['sur place', 'manger ici'],
    frenchLabel: 'Manger sur place',
    phonetic: 'than thee-nee khrap',
    pronunciationFr: 'tan ti-ni krap',
    tone: 'Ton plat + haut',
    context: 'Pour déguster directement au stand ou restaurant',
  },
  {
    frenchKeywords: ['marché', 'stand', 'boutique'],
    frenchLabel: 'Marché / Échoppe',
    phonetic: 'ta-laat',
    pronunciationFr: 'ta-lat',
    tone: 'Ton bas',
    context: 'Lieux traditionnels de commerce et street food',
  },
  {
    frenchKeywords: ['vendeur', 'commerçant', 'monsieur', 'madame'],
    frenchLabel: 'Commerçant / Interpeller le vendeur',
    phonetic: 'phee khrap / mae-khaa',
    pronunciationFr: 'pi krap / mè-ka',
    tone: 'Ton haut',
    context: 'Interpellation amicale et respectueuse',
  },
  {
    frenchKeywords: ['combien', 'combien de temps', 'durée', 'heure', 'minute'],
    frenchLabel: 'Minute / Temps',
    phonetic: 'naa-thee / wee-laa',
    pronunciationFr: 'na-ti / wé-la',
    tone: 'Ton plat',
    context: 'Pour le temps ou la durée',
  },
  {
    frenchKeywords: ['un', 'une'],
    frenchLabel: 'Un (1)',
    phonetic: 'neung',
    pronunciationFr: 'neung',
    tone: 'Ton bas',
    context: 'Quantité : 1',
  },
  {
    frenchKeywords: ['deux'],
    frenchLabel: 'Deux (2)',
    phonetic: 'sòong',
    pronunciationFr: 'song',
    tone: 'Ton montant',
    context: 'Quantité : 2',
  },
  {
    frenchKeywords: ['cent'],
    frenchLabel: 'Cent (100) / Baht',
    phonetic: 'ròi baht',
    pronunciationFr: 'roï bat',
    tone: 'Ton haut + ton bas',
    context: 'Monnaie nationale thaïlandaise',
  },
];

export interface PronunciationEntry {
  frenchLabel: string;
  phonetic: string;
  pronunciationFr: string;
  tone: string;
  context?: string;
  exampleOral?: string;
  exampleFrench?: string;
  occurrences?: number;
}

interface PronunciationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheet: StudySheet;
  initialSearch?: string;
}

export const PronunciationModal: React.FC<PronunciationModalProps> = ({
  isOpen,
  onClose,
  sheet,
  initialSearch = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeEntry, setActiveEntry] = useState<PronunciationEntry | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Index all French items from the current study sheet
  const sheetEntries = useMemo<PronunciationEntry[]>(() => {
    const list: PronunciationEntry[] = [];

    // Words
    sheet.words.forEach((w) => {
      list.push({
        frenchLabel: w.french,
        phonetic: removeThaiScript(w.phonetic || w.thai),
        pronunciationFr: w.pronunciationFr,
        tone: w.tone,
        context: w.category ? `Catégorie : ${w.category}` : undefined,
        exampleOral: removeThaiScript(w.exampleThai),
        exampleFrench: w.exampleFrench,
        occurrences: w.occurrences,
      });
    });

    // Expressions
    sheet.expressions.forEach((e) => {
      list.push({
        frenchLabel: e.french,
        phonetic: removeThaiScript(e.phonetic || e.thai),
        pronunciationFr: e.pronunciationFr,
        tone: 'Expression orale naturelle',
        context: e.context,
        exampleOral: removeThaiScript(e.exampleThai),
        exampleFrench: e.exampleFrench,
        occurrences: e.occurrences,
      });
    });

    // Structures
    sheet.structures.forEach((s) => {
      list.push({
        frenchLabel: s.meaningFrench,
        phonetic: removeThaiScript(s.structureThai),
        pronunciationFr: `Structure : ${removeThaiScript(s.structureThai)}`,
        tone: 'Patron de phrase clé',
        context: s.grammarExplanation,
        exampleOral: removeThaiScript(s.exampleThai),
        exampleFrench: s.exampleFrench,
      });
    });

    // Particles
    sheet.particles.forEach((p) => {
      list.push({
        frenchLabel: `${p.role} (${p.category})`,
        phonetic: removeThaiScript(p.phonetic || p.thai),
        pronunciationFr: removeThaiScript(p.phonetic),
        tone: p.speakerRegister,
        context: p.speakerRegister,
        exampleOral: removeThaiScript(p.exampleUsage),
      });
    });

    return list;
  }, [sheet]);

  // Update search and active entry on prop change
  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch);
      // Try to match best entry
      const q = initialSearch.toLowerCase().trim();
      const directMatch = sheetEntries.find((e) =>
        e.frenchLabel.toLowerCase().includes(q) || q.includes(e.frenchLabel.toLowerCase())
      );
      if (directMatch) {
        setActiveEntry(directMatch);
      } else {
        const lexiconMatch = COMMON_FRENCH_LOOKUP.find((c) =>
          c.frenchKeywords.some((k) => q.includes(k) || k.includes(q))
        );
        if (lexiconMatch) {
          setActiveEntry({
            frenchLabel: lexiconMatch.frenchLabel,
            phonetic: lexiconMatch.phonetic,
            pronunciationFr: lexiconMatch.pronunciationFr,
            tone: lexiconMatch.tone,
            context: lexiconMatch.context,
          });
        } else if (sheetEntries.length > 0) {
          setActiveEntry(sheetEntries[0]);
        }
      }
    } else if (sheetEntries.length > 0 && !activeEntry) {
      setActiveEntry(sheetEntries[0]);
    }
  }, [initialSearch, sheetEntries]);

  // Filtered entries according to search query
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return sheetEntries;
    const q = searchQuery.toLowerCase().trim();

    const fromSheet = sheetEntries.filter(
      (e) =>
        e.frenchLabel.toLowerCase().includes(q) ||
        (e.exampleFrench && e.exampleFrench.toLowerCase().includes(q)) ||
        e.phonetic.toLowerCase().includes(q)
    );

    // If no direct sheet hit, add matches from the common French travel lexicon
    const fromLexicon = COMMON_FRENCH_LOOKUP.filter((c) =>
      c.frenchKeywords.some((k) => k.includes(q) || q.includes(k)) ||
      c.frenchLabel.toLowerCase().includes(q)
    ).map((c) => ({
      frenchLabel: c.frenchLabel,
      phonetic: c.phonetic,
      pronunciationFr: c.pronunciationFr,
      tone: c.tone,
      context: c.context,
    }));

    // Deduplicate
    const combined = [...fromSheet];
    fromLexicon.forEach((lex) => {
      if (!combined.some((item) => item.phonetic.toLowerCase() === lex.phonetic.toLowerCase())) {
        combined.push(lex);
      }
    });

    return combined;
  }, [sheetEntries, searchQuery]);

  const handlePlay = (phonetic: string) => {
    setIsPlayingAudio(true);
    playThaiAudio(phonetic, () => {
      setIsPlayingAudio(false);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl relative">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Prononciation Orale</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-normal">
                  Sans écriture thaïe
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Phonétique adaptée aux francophones & écoute immédiate
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar for French Words */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/50 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cliquez ou tapez un mot en français (ex: piment, addition, combien, eau, merci...)"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Clickable Suggestions from current conversation */}
          <div className="pt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
            <span className="text-slate-400 font-medium shrink-0">Mots clés :</span>
            {sheet.words.slice(0, 7).map((w, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSearchQuery(w.french);
                  setActiveEntry({
                    frenchLabel: w.french,
                    phonetic: removeThaiScript(w.phonetic || w.thai),
                    pronunciationFr: w.pronunciationFr,
                    tone: w.tone,
                    context: w.category,
                    exampleOral: removeThaiScript(w.exampleThai),
                    exampleFrench: w.exampleFrench,
                    occurrences: w.occurrences,
                  });
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700/60 transition cursor-pointer shrink-0 truncate max-w-[130px]"
              >
                {w.french.split('/')[0].split('(')[0].trim()}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5">
          {/* Active Word Main Showcase Card */}
          {activeEntry ? (
            <div className="bg-slate-950/80 border border-amber-500/40 rounded-2xl p-5 sm:p-6 text-center space-y-4 shadow-xl">
              {/* French Word / Expression Clicked */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Mot / Expression en français
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  « {activeEntry.frenchLabel} »
                </h3>
              </div>

              {/* The Pronunciation (NO THAI SCRIPT, 100% LATIN PHONETICS) */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/90 block">
                  Phonétique thaïe (sans alphabet thaï)
                </span>

                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-300 tracking-wide">
                    {activeEntry.phonetic}
                  </span>

                  <button
                    onClick={() => handlePlay(activeEntry.phonetic)}
                    className={`p-3 rounded-2xl border transition cursor-pointer shadow-lg ${
                      isPlayingAudio
                        ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse scale-105'
                        : 'bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border-amber-500/40'
                    }`}
                    title="Écouter la prononciation sonore"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                {/* French Pronunciation Guide with Tones */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs">
                  <span className="text-slate-400">
                    Prononciation guidée :{' '}
                    <strong className="text-amber-200 font-semibold text-sm">
                      {activeEntry.pronunciationFr}
                    </strong>
                  </span>
                  {activeEntry.tone && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 text-[11px] font-medium border border-slate-700">
                      {activeEntry.tone}
                    </span>
                  )}
                </div>
              </div>

              {/* Context and Usage */}
              {activeEntry.context && (
                <div className="text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60">
                  <span className="text-slate-400">Contexte : </span>
                  {activeEntry.context}
                </div>
              )}

              {/* Oral Example if available */}
              {activeEntry.exampleOral && (
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-xs text-left space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px] font-semibold uppercase">
                      Exemple en situation :
                    </span>
                    <button
                      onClick={() => handlePlay(activeEntry.exampleOral!)}
                      className="text-amber-400 hover:text-amber-300 p-1 cursor-pointer"
                      title="Écouter l'exemple"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="font-mono text-amber-200 text-sm font-medium">
                    {activeEntry.exampleOral}
                  </p>
                  {activeEntry.exampleFrench && (
                    <p className="text-slate-300 italic text-[11px]">
                      « {activeEntry.exampleFrench} »
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 space-y-2 bg-slate-950/40 rounded-2xl border border-slate-800">
              <Search className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">
                Tapez un mot français ci-dessus ou cliquez sur une suggestion pour afficher sa prononciation thaïe.
              </p>
            </div>
          )}

          {/* List of matching terms */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Mots français trouvés ({filteredEntries.length}) :
            </span>

            <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
              {filteredEntries.map((entry, idx) => {
                const isSelected = activeEntry?.phonetic === entry.phonetic;

                return (
                  <button
                    key={idx}
                    onClick={() => setActiveEntry(entry)}
                    className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/50 text-white'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="space-y-0.5 truncate pr-2">
                      <div className="font-semibold text-xs text-white truncate">
                        {entry.frenchLabel}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                        <span className="text-amber-300 font-semibold">{entry.phonetic}</span>
                        <span>•</span>
                        <span className="italic">{entry.pronunciationFr}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlay(entry.phonetic);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 text-slate-300 hover:text-slate-950 transition cursor-pointer"
                        title="Écouter"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>
            💡 Cliquez sur un mot français pour écouter sa prononciation
          </span>
          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
