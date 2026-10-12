import React, { useState, useRef } from 'react';
import {
  History,
  Trash2,
  Download,
  Upload,
  Eye,
  FileText,
  Clock,
  Sparkles,
  AlertTriangle,
  Check,
  Search,
  ListFilter,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { StudySheet } from '../types';
import { downloadSheetAsTxt } from '../utils/exportText';
import { parseMultipleSheetFiles } from '../utils/importText';

interface SessionHistoryViewProps {
  sheets: StudySheet[];
  activeSheetId: string | null;
  onSelectSheet: (id: string) => void;
  onDeleteSheet: (id: string) => void;
  onClearSession: () => void;
  onStartNewRecording: () => void;
  onImportSheets?: (sheets: StudySheet[]) => void;
}

export const SessionHistoryView: React.FC<SessionHistoryViewProps> = ({
  sheets,
  activeSheetId,
  onSelectSheet,
  onDeleteSheet,
  onClearSession,
  onStartNewRecording,
  onImportSheets,
}) => {
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedSummaryId, setExpandedSummaryId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const totalExpressionsCount = sheets.reduce((acc, s) => acc + s.expressions.length, 0);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const { successSheets, errorCount } = await parseMultipleSheetFiles(files);

    if (successSheets.length > 0 && onImportSheets) {
      onImportSheets(successSheets);
      const totalExpr = successSheets.reduce((acc, s) => acc + s.expressions.length, 0);
      setImportNotice(`${successSheets.length} fiche(s) importée(s) avec succès ! (+${totalExpr} expressions ajoutées).`);
      setTimeout(() => setImportNotice(null), 5000);
    } else if (errorCount > 0) {
      setImportNotice("Erreur lors de la lecture des fichiers. Assurez-vous d'importer des fichiers .txt valides.");
      setTimeout(() => setImportNotice(null), 5000);
    }

    if (e.target) e.target.value = '';
  };

  const filteredSheets = sheets.filter((sheet) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      sheet.title.toLowerCase().includes(q) ||
      (sheet.summary && sheet.summary.toLowerCase().includes(q)) ||
      sheet.words.some((w) => w.french.toLowerCase().includes(q) || w.thai.includes(q)) ||
      sheet.expressions.some((e) => e.french.toLowerCase().includes(q))
    );
  });

  const toggleSummary = (id: string) => {
    setExpandedSummaryId((prev) => (prev === id ? null : id));
  };

  if (sheets.length === 0) {
    return (
      <div className="w-full max-w-xl mx-auto py-12 px-6 text-center space-y-5 bg-slate-900/60 border border-slate-800 rounded-3xl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500">
          <History className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">
            Aucun enregistrement dans l'historique
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Lancez un enregistrement (découpé par tranches de 1 à 5 minutes) ou importez des fiches téléchargées pour retrouver ici leurs résumés, points clés et vocabulaire.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onStartNewRecording}
            className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
          >
            Démarrer un enregistrement
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
          >
            <Upload className="w-4 h-4 text-amber-400" />
            <span>Importer des fiches (max 5)</span>
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
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 pb-12">
      {/* Import Notification Banner */}
      {importNotice && (
        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{importNotice}</span>
        </div>
      )}

      {/* Session summary header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-5 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">
              Historique des enregistrements
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
              {sheets.length} synthèse{sheets.length > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Retranscriptions synthétisées avec résumé et points clés extraits.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold border border-amber-500/30 flex items-center gap-1.5 transition cursor-pointer"
            title="Importer jusqu'à 5 fiches texte (.txt)"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Importer (max 5)</span>
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
            onClick={onClearSession}
            className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/20 flex items-center gap-1.5 transition cursor-pointer"
            title="Effacer tout l'historique"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Réinitialiser</span>
          </button>
        </div>
      </div>

      {/* Search filter if multiple sheets */}
      {sheets.length > 2 && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par titre, mot thaï ou sujet du résumé..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/80"
          />
        </div>
      )}

      {/* Syntheses Overview Banner */}
      {sheets.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Synthèse des Discussions
              </h3>
              <p className="text-xs text-slate-300">
                <strong className="text-amber-400">{sheets.length} conversation(s)</strong> résumée(s) avec points clés et vocabulaire oral.
              </p>
            </div>
          </div>
          <button
            onClick={onStartNewRecording}
            className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shrink-0"
          >
            <Clock className="w-4 h-4" />
            <span>Nouvel enregistrement</span>
          </button>
        </div>
      )}

      {/* Sheets List with prominent Summaries & Key Points */}
      <div className="space-y-4">
        {filteredSheets.map((sheet) => {
          const isActive = sheet.id === activeSheetId;
          const isExpanded = expandedSummaryId === sheet.id;

          return (
            <div
              key={sheet.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isActive
                  ? 'bg-slate-900 border-amber-500/60 ring-1 ring-amber-500/30'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {sheet.partNumber && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 font-mono">
                        Partie {sheet.partNumber}
                      </span>
                    )}
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {sheet.stats.durationFormatted}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-[11px] text-slate-400">
                      {sheet.dateFormatted}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">
                    {sheet.title}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-slate-300 font-mono">
                    <span>
                      <strong className="text-amber-400">{sheet.words.length}</strong> mots
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-orange-400">{sheet.expressions.length}</strong> expressions
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-teal-400">{sheet.structures.length}</strong> structures
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap sm:flex-nowrap">
                  <button
                    onClick={() => onSelectSheet(sheet.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {isActive ? 'Synthèse active' : 'Voir la synthèse'}
                  </button>

                  <button
                    onClick={() => downloadSheetAsTxt(sheet)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                    title="Télécharger la fiche (.txt)"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteSheet(sheet.id)}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700/60 transition cursor-pointer"
                    title="Supprimer cette fiche"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Résumé Synthétique & Points Clés Preview */}
              <div className="pt-3.5 space-y-2.5">
                {sheet.summary && (
                  <div className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Résumé synthétique</span>
                      </span>
                      {sheet.keyPoints && sheet.keyPoints.length > 0 && (
                        <button
                          onClick={() => toggleSummary(sheet.id)}
                          className="text-[11px] font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isExpanded ? 'Masquer points clés' : 'Voir points clés'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {sheet.summary}
                    </p>

                    {/* Key points expansion */}
                    {(isExpanded || !sheet.keyPoints || sheet.keyPoints.length <= 2) && sheet.keyPoints && sheet.keyPoints.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Points clés essentiels :
                        </span>
                        <ul className="space-y-1">
                          {sheet.keyPoints.map((kp, idx) => (
                            <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                              <span className="text-amber-400 text-sm leading-none shrink-0">•</span>
                              <span>{kp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
