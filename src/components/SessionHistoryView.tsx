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
  GraduationCap,
  Check,
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
  onOpenFlashcards: (sheetId?: string) => void;
  onImportSheets?: (sheets: StudySheet[]) => void;
}

export const SessionHistoryView: React.FC<SessionHistoryViewProps> = ({
  sheets,
  activeSheetId,
  onSelectSheet,
  onDeleteSheet,
  onClearSession,
  onStartNewRecording,
  onOpenFlashcards,
  onImportSheets,
}) => {
  const [importNotice, setImportNotice] = useState<string | null>(null);
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
      setImportNotice("Erreur lors de la lecture des fichiers. Assurez-vous d'importer des fichiers .txt de fiches valides.");
      setTimeout(() => setImportNotice(null), 5000);
    }

    if (e.target) e.target.value = '';
  };

  if (sheets.length === 0) {
    return (
      <div className="w-full max-w-xl mx-auto py-12 px-6 text-center space-y-5 bg-slate-900/60 border border-slate-800 rounded-3xl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500">
          <History className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">
            Aucune fiche dans la session actuelle
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Enregistrez une conversation ou importez jusqu'à 5 fiches texte (.txt) déjà téléchargées pour les consulter et générer des flashcards.
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
              Historique de session
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
              {sheets.length} fiche{sheets.length > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Fiches de la session active (sans compte ni base de données distante).
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
            title="Effacer toutes les fiches de la session"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Réinitialiser</span>
          </button>
        </div>
      </div>

      {/* Flashcards Banner */}
      {totalExpressionsCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Pratiquer en Flashcards
              </h3>
              <p className="text-xs text-slate-300">
                Mémorisez les <strong className="text-amber-400">{totalExpressionsCount} expressions</strong> extraites de votre historique.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenFlashcards('all')}
            className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shrink-0"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Lancer les flashcards</span>
          </button>
        </div>
      )}

      {/* Sheets List */}
      <div className="space-y-3">
        {sheets.map((sheet) => {
          const isActive = sheet.id === activeSheetId;

          return (
            <div
              key={sheet.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isActive
                  ? 'bg-slate-900 border-amber-500/60 ring-1 ring-amber-500/30'
                  : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
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
                    {isActive ? 'Active' : 'Consulter'}
                  </button>

                  <button
                    onClick={() => onOpenFlashcards(sheet.id)}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                    title="Pratiquer les expressions de cette conversation en flashcards"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Flashcards</span>
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
            </div>
          );
        })}
      </div>
    </div>
  );
};
