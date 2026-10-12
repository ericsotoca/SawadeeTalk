import React, { useState, useEffect, useRef } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  BookOpen,
  ArrowRightLeft,
  Search,
  ChevronRight,
  MapPin,
  Calendar,
  Compass,
} from 'lucide-react';

interface StealthDecoyViewProps {
  onExitStealth: () => void;
  decoyType?: 'notes' | 'converter' | 'article';
}

export const StealthDecoyView: React.FC<StealthDecoyViewProps> = ({
  onExitStealth,
  decoyType = 'notes',
}) => {
  const [activeDecoy, setActiveDecoy] = useState<'notes' | 'converter' | 'article'>(decoyType);
  const clickTimestampsRef = useRef<number[]>([]);

  // Notes state for interactive realism
  const [todoList, setTodoList] = useState<Array<{ id: number; text: string; done: boolean }>>([
    { id: 1, text: 'Visite Wat Phra Kaeo & Grand Palais (tenue correcte)', done: true },
    { id: 2, text: 'Changer 200€ au guichet SuperRich (meilleur taux)', done: true },
    { id: 3, text: 'Prendre carte Rabbit Card pour le BTS Skytrain', done: false },
    { id: 4, text: 'Acheter pantalon ample et crème solaire au marché', done: false },
    { id: 5, text: 'Goûter le Mango Sticky Rice vers Thong Lo', done: false },
  ]);
  const [newNoteInput, setNewNoteInput] = useState('');
  const [memoText, setMemoText] = useState(
    "Adresses utiles Bangkok :\n- Hôtel : Sukhumvit Soi 24, BTS Phrom Phong\n- Pharmacie 24h : en face du 7-Eleven angle Soi 22\n- Vol retour : BKK Suvarnabhumi terminal 1 porte 4"
  );

  // Converter state for interactive realism
  const [eurAmount, setEurAmount] = useState<string>('50');
  const rateEurToThb = 38.65;
  const thbAmount = (parseFloat(eurAmount || '0') * rateEurToThb).toFixed(1);

  // Global Triple-Click / Triple-Tap detector
  const handleGlobalTap = () => {
    const now = Date.now();
    // Keep only taps in the last 900ms
    clickTimestampsRef.current = [...clickTimestampsRef.current.filter((t) => now - t < 900), now];

    if (clickTimestampsRef.current.length >= 3) {
      clickTimestampsRef.current = [];
      onExitStealth();
    }
  };

  const toggleTodo = (id: number) => {
    setTodoList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteInput.trim()) return;
    setTodoList((prev) => [
      ...prev,
      { id: Date.now(), text: newNoteInput.trim(), done: false },
    ]);
    setNewNoteInput('');
  };

  return (
    <div
      onClick={handleGlobalTap}
      className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none"
      title="Triple-cliquez n'importe où pour revenir"
    >
      {/* Completely innocent top bar (looks like a native Notes or Travel app) */}
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
            {activeDecoy === 'notes' && <CheckSquare className="w-4 h-4 text-amber-400" />}
            {activeDecoy === 'converter' && <ArrowRightLeft className="w-4 h-4 text-emerald-400" />}
            {activeDecoy === 'article' && <Compass className="w-4 h-4 text-sky-400" />}
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-200">
              {activeDecoy === 'notes' && 'Mes Notes de Voyage'}
              {activeDecoy === 'converter' && 'Convertisseur EUR / THB'}
              {activeDecoy === 'article' && 'Guide Visite Thaïlande'}
            </h1>
            <p className="text-[11px] text-slate-400">Bangkok • Mis à jour aujourd'hui</p>
          </div>
        </div>

        {/* Innocent sub-navigation between decoy tabs */}
        <div
          onClick={(e) => e.stopPropagation()} // don't trigger tap counter when switching tabs
          className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/60"
        >
          <button
            onClick={() => setActiveDecoy('notes')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              activeDecoy === 'notes' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mémos
          </button>
          <button
            onClick={() => setActiveDecoy('converter')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              activeDecoy === 'converter' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Change
          </button>
          <button
            onClick={() => setActiveDecoy('article')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              activeDecoy === 'article' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Guide
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4 space-y-4">
        {activeDecoy === 'notes' && (
          <div className="space-y-4">
            {/* Search bar placeholder */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 bg-slate-800/70 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-slate-400"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>Rechercher dans les notes et adresses...</span>
            </div>

            {/* Checklist items */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4 space-y-2.5"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Checklist séjour Bangkok
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {todoList.filter((t) => t.done).length}/{todoList.length}
                </span>
              </div>

              <div className="space-y-1.5">
                {todoList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleTodo(item.id)}
                    className="flex items-start gap-2.5 py-1 px-1 rounded-lg hover:bg-slate-700/30 transition cursor-pointer"
                  >
                    {item.done ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    )}
                    <span
                      className={`text-xs ${
                        item.done ? 'line-through text-slate-500' : 'text-slate-200'
                      }`}
                    >
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddTodo} className="pt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Ajouter une note..."
                  value={newNoteInput}
                  onChange={(e) => setNewNoteInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* Free editable Notepad */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Mémo rapide
                </span>
                <span className="text-[10px] text-slate-500">Sauvegardé localement</span>
              </div>
              <textarea
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                rows={5}
                className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none font-mono leading-relaxed"
              />
            </div>
          </div>
        )}

        {activeDecoy === 'converter' && (
          <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Taux de change indicatif</span>
                <span className="font-mono text-emerald-400">1 € ≈ {rateEurToThb} THB</span>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-3">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Montant en Euros (€)
                  </label>
                  <div className="flex items-center justify-between">
                    <input
                      type="number"
                      value={eurAmount}
                      onChange={(e) => setEurAmount(e.target.value)}
                      className="bg-transparent text-xl font-bold font-mono text-white focus:outline-none w-full"
                    />
                    <span className="text-sm font-semibold text-slate-400 ml-2">EUR</span>
                  </div>
                </div>

                <div className="flex justify-center -my-1">
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                    <ArrowRightLeft className="w-3.5 h-3.5 rotate-90" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-700 rounded-xl p-3">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Équivalent en Bahts Thaïlandais (THB)
                  </label>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold font-mono text-amber-400">{thbAmount}</span>
                    <span className="text-sm font-semibold text-slate-400 ml-2">THB</span>
                  </div>
                </div>
              </div>

              {/* Quick Conversion Chips */}
              <div className="grid grid-cols-4 gap-2 pt-2">
                {['10', '20', '50', '100'].map((val) => (
                  <button
                    key={val}
                    onClick={() => setEurAmount(val)}
                    className="py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-xs font-mono font-medium text-slate-200 transition"
                  >
                    {val} €
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">💡 Astuce change en Thaïlande :</p>
              <p>Privilégiez les bureaux de change physiques SuperRich (vert ou orange) pour obtenir le taux réel le plus avantageux sans commission cachée.</p>
            </div>
          </div>
        )}

        {activeDecoy === 'article' && (
          <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold">
                <MapPin className="w-3.5 h-3.5" />
                <span>Guide Essentiel Bangkok</span>
              </div>
              <h2 className="text-base font-bold text-white">
                5 conseils indispensables pour circuler dans la capitale
              </h2>
              <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                <p>
                  <strong>1. Le BTS Skytrain & MRT :</strong> C'est de loin le moyen le plus rapide d'éviter les embouteillages légendaires de Sukhumvit et Silom pendant les heures de pointe.
                </p>
                <p>
                  <strong>2. Les taxis officiels :</strong> Vérifiez toujours que le chauffeur enclenche le compteur (demandez poliment <em>"meter na krap"</em>). Si le chauffeur refuse, prenez le taxi suivant.
                </p>
                <p>
                  <strong>3. Bateaux-bus Chao Phraya Express :</strong> Très pratique et pittoresque pour rejoindre le Grand Palais, Wat Pho et le marché aux fleurs pour moins de 20 bahts.
                </p>
                <p>
                  <strong>4. Respect des temples :</strong> Épaules et genoux couverts obligatoires. Enlevez toujours vos chaussures avant de pénétrer dans le sanctuaire.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Invisible footer area with zero recording hints */}
      <footer className="p-3 text-center text-[10px] text-slate-600 border-t border-slate-800/50">
        <span>© Carnet de voyage 2026 • Hors connexion</span>
      </footer>
    </div>
  );
};
