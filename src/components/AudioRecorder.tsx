import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Upload,
  AlertCircle,
  Clock,
  Volume2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface AudioRecorderProps {
  onAnalyzeAudio: (audioBase64: string, mimeType: string, durationSeconds: number) => void;
  onSelectDemoScenario: (scenarioId: string) => void;
  isAnalyzing: boolean;
}

const MAX_RECORDING_SECONDS = 60; // 1 minute

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onAnalyzeAudio,
  onSelectDemoScenario,
  isAnalyzing,
}) => {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string>('audio/webm');
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [micPermissionDenied, setMicPermissionDenied] = useState<boolean>(false);

  // References
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dictaphoneInputRef = useRef<HTMLInputElement | null>(null);

  // Timer updater
  useEffect(() => {
    if (recordingState === 'recording') {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= MAX_RECORDING_SECONDS) {
            stopRecording();
            return MAX_RECORDING_SECONDS;
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [recordingState]);

  // Clean up media streams and audio context on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  const cleanupAudio = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
  };

  // Find best supported audio mime type
  const getSupportedMimeType = (): string => {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav',
    ];
    for (const candidate of candidates) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(candidate)) {
        return candidate;
      }
    }
    return '';
  };

  // Audio level visualizer loop
  const startVisualizer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setVolumeLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (err) {
      console.warn("Visualizer audio non supporté:", err);
    }
  };

  // Start recording
  const startRecording = async () => {
    setErrorMessage(null);
    setMicPermissionDenied(false);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("L'enregistrement audio n'est pas supporté par ce navigateur.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, options);

      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || mimeType || 'audio/webm',
        });
        setAudioBlob(finalBlob);
        setAudioMimeType(recorder.mimeType || mimeType || 'audio/webm');
        const url = URL.createObjectURL(finalBlob);
        setAudioUrl(url);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(500); // 500ms chunks

      startVisualizer(stream);
      setRecordingState('recording');
      setElapsedSeconds(0);
    } catch (err: any) {
      console.warn("Accès microphone refusé ou non disponible :", err?.name || err?.message);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermissionDenied(true);
        setErrorMessage("L'accès au microphone a été refusé par le navigateur. Vous pouvez autoriser le micro, utiliser le dictaphone natif de votre téléphone, ou tester une démo.");
      } else {
        setErrorMessage(err.message || "Impossible d'accéder au microphone.");
      }
    }
  };

  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
    }
  };

  // Resume recording
  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
    }
  };

  // Stop recording manually
  const stopRecording = () => {
    if (mediaRecorderRef.current && (recordingState === 'recording' || recordingState === 'paused')) {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      setRecordingState('stopped');
      setVolumeLevel(0);
    }
  };

  // Reset / Discard recording
  const resetRecording = () => {
    cleanupAudio();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setRecordingState('idle');
    setElapsedSeconds(0);
    setAudioBlob(null);
    setAudioUrl(null);
    setVolumeLevel(0);
    setErrorMessage(null);
    setMicPermissionDenied(false);
  };

  // Trigger analysis
  const handleAnalyze = async () => {
    if (!audioBlob) {
      setErrorMessage("Aucun audio enregistré à analyser.");
      return;
    }

    if (elapsedSeconds < 2) {
      setErrorMessage("L'enregistrement est trop court (minimum 2 secondes).");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const raw = reader.result as string;
        const cleanBase64 = raw.includes(';base64,') ? raw.split(';base64,')[1] : raw;
        const cleanMime = (audioMimeType || 'audio/webm').split(';')[0].trim();
        onAnalyzeAudio(cleanBase64, cleanMime, elapsedSeconds);
      };
      reader.readAsDataURL(audioBlob);
    } catch (err: any) {
      setErrorMessage("Erreur de conversion audio : " + err.message);
    }
  };

  // Handle file upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 40 * 1024 * 1024) {
      setErrorMessage("Fichier audio trop lourd (maximum 40 Mo).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const raw = reader.result as string;
      const cleanBase64 = raw.includes(';base64,') ? raw.split(';base64,')[1] : raw;
      const cleanMime = (file.type || 'audio/mp3').split(';')[0].trim();
      // Estimate duration from file size or standard 30-60s
      const estimatedSec = Math.min(60, Math.max(10, Math.round(file.size / 32000)));
      onAnalyzeAudio(cleanBase64, cleanMime, estimatedSec);
    };
    reader.readAsDataURL(file);
  };

  // Formatting helpers
  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const remainingSeconds = Math.max(0, MAX_RECORDING_SECONDS - elapsedSeconds);
  const progressPercent = (elapsedSeconds / MAX_RECORDING_SECONDS) * 100;

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Notice & Safety Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 flex items-start gap-3 backdrop-blur-sm">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-100">
            Confidentialité & Respect Pédagogique
          </p>
          <p className="text-slate-400 leading-relaxed">
            Conformément à la règle fondamentale : <span className="text-amber-300 font-medium">la conversation intégrale ne sera jamais restituée</span>. Seules les statistiques, les expressions réelles, les structures grammaticales et le vocabulaire utile sont extraits.
          </p>
        </div>
      </div>

      {/* Main Recording Console */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {/* Subtle accent glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header / Step indicator */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/60 mb-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold ring-1 ring-amber-500/40">
              A
            </span>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-300">
              Étape A — Enregistrer la conversation
            </h2>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Max 1 min
          </span>
        </div>

        {/* Timer & Gauge */}
        <div className="text-center py-4 space-y-3">
          <div className="inline-flex items-baseline gap-2">
            <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white drop-shadow-sm">
              {formatTime(elapsedSeconds)}
            </span>
            <span className="text-sm font-medium text-slate-400">
              / 01:00
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
            <span>Temps restant :</span>
            <span className={`font-mono font-semibold ${remainingSeconds < 15 ? 'text-rose-400 font-bold' : 'text-amber-400'}`}>
              {formatTime(remainingSeconds)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden ring-1 ring-slate-700/50">
            <div
              className={`h-full transition-all duration-300 ${
                recordingState === 'recording'
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500'
                  : 'bg-slate-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Audio Waveform / Visualizer */}
        <div className="my-6 h-16 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex items-center justify-center px-4 gap-1.5 overflow-hidden">
          {recordingState === 'recording' ? (
            <div className="flex items-center justify-center gap-1.5 h-12 w-full">
              {[...Array(24)].map((_, i) => {
                const dynamicHeight = Math.max(
                  6,
                  Math.min(48, Math.sin((i / 24) * Math.PI) * volumeLevel * 0.9 + (i % 3) * 4)
                );
                return (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-gradient-to-t from-amber-500 to-orange-400 transition-all duration-75"
                    style={{ height: `${dynamicHeight}px` }}
                  />
                );
              })}
            </div>
          ) : recordingState === 'paused' ? (
            <div className="flex items-center gap-2 text-xs font-medium text-amber-400">
              <Pause className="w-4 h-4 animate-pulse" />
              <span>Enregistrement en pause — Appuyez sur Reprendre</span>
            </div>
          ) : audioUrl ? (
            <div className="w-full flex items-center justify-center gap-3">
              <audio src={audioUrl} controls className="w-full max-w-sm h-8" />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Mic className="w-4 h-4 text-slate-600" />
              <span>Prêt pour l'enregistrement (français, thaï ou bilingue)</span>
            </div>
          )}
        </div>

        {/* Primary Controls Buttons */}
        <div className="space-y-3 pt-2">
          {recordingState === 'idle' && (
            <button
              onClick={startRecording}
              disabled={isAnalyzing}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 active:scale-[0.98] text-white font-bold text-base flex items-center justify-center gap-3 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
              </span>
              Démarrer l'enregistrement
            </button>
          )}

          {recordingState === 'recording' && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={pauseRecording}
                className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
              >
                <Pause className="w-4 h-4 text-amber-400" />
                Mettre en pause
              </button>

              <button
                onClick={stopRecording}
                className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <Square className="w-4 h-4 fill-white" />
                Arrêter
              </button>
            </div>
          )}

          {recordingState === 'paused' && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={resumeRecording}
                className="py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                Reprendre
              </button>

              <button
                onClick={stopRecording}
                className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
              >
                <Square className="w-4 h-4" />
                Terminer
              </button>
            </div>
          )}

          {/* Stopped state: Confirm & analyze or restart */}
          {recordingState === 'stopped' && (
            <div className="space-y-3">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98] text-white font-bold text-base flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-5 h-5 text-amber-200" />
                Terminer et analyser la conversation
              </button>

              <button
                onClick={resetRecording}
                disabled={isAnalyzing}
                className="w-full py-3 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:scale-[0.98] text-slate-300 font-medium text-sm flex items-center justify-center gap-2 border border-slate-700/60 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-400" />
                Recommencer l'enregistrement
              </button>
            </div>
          )}
        </div>

        {/* Error Feedback & Permission Recovery */}
        {micPermissionDenied ? (
          <div className="mt-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-300">
                  Accès au microphone non autorisé dans ce navigateur
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Pour enregistrer directement en ligne : vérifiez que le micro est autorisé dans l'icône de cadenas 🔒 de votre barre d'adresse.
                </p>
              </div>
            </div>

            <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => dictaphoneInputRef.current?.click()}
                className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Dictaphone natif (mobile)</span>
              </button>

              <button
                onClick={startRecording}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Réessayer l'accès micro</span>
              </button>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        ) : null}
      </div>

      {/* Alternative Options: Import audio or Test instant scenario */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* File upload option */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1">
              <Upload className="w-4 h-4 text-amber-400" />
              <span>Importer un fichier audio</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Vous avez déjà un mémo vocal enregistré sur votre téléphone ? (.mp3, .wav, .m4a, .webm)
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing || recordingState !== 'idle'}
            className="mt-3 w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer disabled:opacity-40"
          >
            Choisir un fichier audio
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          {/* Native mobile dictaphone capture trigger */}
          <input
            ref={dictaphoneInputRef}
            type="file"
            accept="audio/*"
            capture="user"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Demonstration presets */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Démos réelles pré-enregistrées</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Testez immédiatement sans micro avec des conversations réelles franco-thaïlandaises types.
            </p>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <button
              onClick={() => onSelectDemoScenario('streetfood')}
              disabled={isAnalyzing}
              className="py-2 px-1 text-center rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-200 border border-slate-700/60 transition cursor-pointer disabled:opacity-40"
              title="Commande street food & Pad Thaï"
            >
              🍜 Street Food
            </button>
            <button
              onClick={() => onSelectDemoScenario('market')}
              disabled={isAnalyzing}
              className="py-2 px-1 text-center rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-200 border border-slate-700/60 transition cursor-pointer disabled:opacity-40"
              title="Négociation amicale au marché"
            >
              🛍️ Marché
            </button>
            <button
              onClick={() => onSelectDemoScenario('taxi')}
              disabled={isAnalyzing}
              className="py-2 px-1 text-center rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-200 border border-slate-700/60 transition cursor-pointer disabled:opacity-40"
              title="Course de taxi & Itinéraire"
            >
              🚕 Taxi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
