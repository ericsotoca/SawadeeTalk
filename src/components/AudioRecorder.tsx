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
  EyeOff,
  Settings2,
  Scissors,
  CheckCircle2,
} from 'lucide-react';

interface AudioRecorderProps {
  onAnalyzeAudio: (
    audioBase64: string,
    mimeType: string,
    durationSeconds: number,
    partNumber?: number,
    sessionId?: string
  ) => void;
  onSelectDemoScenario: (scenarioId: string) => void;
  isAnalyzing: boolean;
  onEnterStealth?: () => void;
  isInStealth?: boolean;
  chunkDurationMinutes?: number;
  onSetChunkDuration?: (minutes: number) => void;
  continuousSegmenting?: boolean;
  onToggleContinuous?: (enabled: boolean) => void;
  autoStealthOnStart?: boolean;
  onToggleAutoStealth?: (enabled: boolean) => void;
  onOpenSettingsModal?: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onAnalyzeAudio,
  onSelectDemoScenario,
  isAnalyzing,
  onEnterStealth,
  isInStealth = false,
  chunkDurationMinutes: propChunkDuration,
  onSetChunkDuration: propOnSetChunkDuration,
  continuousSegmenting: propContinuousSegmenting,
  onToggleContinuous: propOnToggleContinuous,
  autoStealthOnStart: propAutoStealthOnStart,
  onToggleAutoStealth: propOnToggleAutoStealth,
  onOpenSettingsModal,
}) => {
  // Configurable settings (stored in localStorage with fallback to props)
  const [localChunkDurationMinutes, setLocalChunkDurationMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('sawasdee_chunk_min');
    return saved ? parseInt(saved, 10) : 2; // Default 2 minutes
  });
  const [localAutoStealthOnStart, setLocalAutoStealthOnStart] = useState<boolean>(() => {
    const saved = localStorage.getItem('sawasdee_auto_stealth');
    return saved !== null ? saved === 'true' : true; // Default enabled
  });
  const [localContinuousSegmenting, setLocalContinuousSegmenting] = useState<boolean>(() => {
    const saved = localStorage.getItem('sawasdee_continuous');
    return saved !== null ? saved === 'true' : true; // Default enabled
  });

  const chunkDurationMinutes = propChunkDuration !== undefined ? propChunkDuration : localChunkDurationMinutes;
  const autoStealthOnStart = propAutoStealthOnStart !== undefined ? propAutoStealthOnStart : localAutoStealthOnStart;
  const continuousSegmenting = propContinuousSegmenting !== undefined ? propContinuousSegmenting : localContinuousSegmenting;

  const handleSetChunkDuration = (minutes: number) => {
    setLocalChunkDurationMinutes(minutes);
    localStorage.setItem('sawasdee_chunk_min', minutes.toString());
    if (propOnSetChunkDuration) propOnSetChunkDuration(minutes);
  };

  const handleToggleAutoStealth = (enabled: boolean) => {
    setLocalAutoStealthOnStart(enabled);
    localStorage.setItem('sawasdee_auto_stealth', enabled.toString());
    if (propOnToggleAutoStealth) propOnToggleAutoStealth(enabled);
  };

  const handleToggleContinuous = (enabled: boolean) => {
    setLocalContinuousSegmenting(enabled);
    localStorage.setItem('sawasdee_continuous', enabled.toString());
    if (propOnToggleContinuous) propOnToggleContinuous(enabled);
  };

  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  const [currentChunkSeconds, setCurrentChunkSeconds] = useState<number>(0);
  const [totalSessionSeconds, setTotalSessionSeconds] = useState<number>(0);
  const [currentPartNumber, setCurrentPartNumber] = useState<number>(1);
  const [sessionId, setSessionId] = useState<string>('');
  const [partsProcessedCount, setPartsProcessedCount] = useState<number>(0);

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string>('audio/webm');
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [micPermissionDenied, setMicPermissionDenied] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // References for live stream & recording slices
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const currentChunkBlobsRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dictaphoneInputRef = useRef<HTMLInputElement | null>(null);

  // Target seconds for each chunk (e.g., 1 min = 60s, 2 min = 120s, up to 5 min = 300s)
  const maxChunkSeconds = chunkDurationMinutes * 60;

  // Refs to guarantee freshest state in callbacks
  const sessionIdRef = useRef<string>('');
  const partNumberRef = useRef<number>(1);
  const isHandingOverRef = useRef<boolean>(false);
  const currentChunkSecondsRef = useRef<number>(0);
  const recordingStateRef = useRef<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  recordingStateRef.current = recordingState;
  currentChunkSecondsRef.current = currentChunkSeconds;
  sessionIdRef.current = sessionId;
  partNumberRef.current = currentPartNumber;

  // Timer loop for chunk tracking & auto-segmentation
  useEffect(() => {
    if (recordingState === 'recording') {
      timerIntervalRef.current = setInterval(() => {
        setTotalSessionSeconds((prev) => prev + 1);
        setCurrentChunkSeconds((prev) => {
          const next = prev + 1;
          if (next >= maxChunkSeconds) {
            // Cut and finalize current chunk segment!
            handleChunkBoundaryReached();
            return 0;
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
  }, [recordingState, maxChunkSeconds, continuousSegmenting]);

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

  // Converts a Blob to Base64 and triggers automatic background analysis
  const dispatchChunkForAnalysis = (
    blob: Blob,
    durationSec: number,
    partNum: number,
    currentSid: string,
    explicitMime?: string
  ) => {
    if (!blob || blob.size < 1200) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const raw = reader.result as string;
      if (!raw) return;
      const cleanBase64 = raw.includes(';base64,') ? raw.split(';base64,')[1] : raw;
      const cleanMime = (explicitMime || blob.type || audioMimeType || 'audio/webm').split(';')[0].trim();
      onAnalyzeAudio(cleanBase64, cleanMime, durationSec, partNum, currentSid);
      setPartsProcessedCount((prev) => prev + 1);
    };
    reader.readAsDataURL(blob);
  };

  // Starts a distinct MediaRecorder instance for a specific part
  const startRecorderInstance = (partNum: number) => {
    if (!streamRef.current) return;
    try {
      const mime = getSupportedMimeType();
      const options = mime ? { mimeType: mime } : undefined;
      const recorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = recorder;
      currentChunkBlobsRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          currentChunkBlobsRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const recordedBlobs = [...currentChunkBlobsRef.current];
        const finalBlob = new Blob(recordedBlobs, {
          type: recorder.mimeType || mime || 'audio/webm',
        });
        const cleanMime = (recorder.mimeType || mime || 'audio/webm').split(';')[0].trim();
        setAudioMimeType(cleanMime);

        if (isHandingOverRef.current) {
          // Handover chunk boundary reached (1-5 min)
          isHandingOverRef.current = false;
          if (finalBlob.size >= 1200) {
            dispatchChunkForAnalysis(finalBlob, maxChunkSeconds, partNum, sessionIdRef.current, cleanMime);
          }
          // Seamlessly start the next part immediately on the same microphone stream!
          if (recordingStateRef.current === 'recording') {
            const nextPart = partNum + 1;
            partNumberRef.current = nextPart;
            setCurrentPartNumber(nextPart);
            setCurrentChunkSeconds(0);
            startRecorderInstance(nextPart);
          }
        } else {
          // Final manual stop
          setAudioBlob(finalBlob);
          const url = URL.createObjectURL(finalBlob);
          setAudioUrl(url);
          // Auto-dispatch final segment if valid duration
          if (finalBlob.size >= 1200 && currentChunkSecondsRef.current >= 2) {
            dispatchChunkForAnalysis(
              finalBlob,
              Math.max(2, currentChunkSecondsRef.current),
              partNum,
              sessionIdRef.current,
              cleanMime
            );
          }
        }
      };

      recorder.start(1000); // Collect data chunks every 1 second
    } catch (err: any) {
      console.warn("Erreur démarrage instance enregistreur:", err);
      setErrorMessage("Erreur d'initialisation du micro : " + (err?.message || err));
    }
  };

  // Cut chunk when the time limit (1-5 min) is reached
  const handleChunkBoundaryReached = () => {
    if (!mediaRecorderRef.current || recordingStateRef.current !== 'recording') return;

    if (continuousSegmenting) {
      // Cleanly stop current recorder instance so it finalizes its WebM/MP4 container header & footer
      isHandingOverRef.current = true;
      mediaRecorderRef.current.stop();
    } else {
      // Single chunk mode: stop recorder
      stopRecording();
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

      const newSessionId = 'sess_' + Date.now();
      setSessionId(newSessionId);
      sessionIdRef.current = newSessionId;
      setCurrentPartNumber(1);
      partNumberRef.current = 1;
      setPartsProcessedCount(0);
      isHandingOverRef.current = false;

      startVisualizer(stream);
      setRecordingState('recording');
      recordingStateRef.current = 'recording';
      setCurrentChunkSeconds(0);
      setTotalSessionSeconds(0);

      // Start first part recorder instance
      startRecorderInstance(1);

      // Immediately switch to stealth / decoy screen if enabled
      if (autoStealthOnStart && onEnterStealth) {
        onEnterStealth();
      }
    } catch (err: any) {
      console.warn("Accès microphone refusé :", err?.name || err?.message);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermissionDenied(true);
        setErrorMessage("L'accès au micro a été refusé par le navigateur. Vous pouvez autoriser le micro ou importer un fichier audio.");
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
      recordingStateRef.current = 'paused';
    }
  };

  // Resume recording
  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      recordingStateRef.current = 'recording';
    }
  };

  // Stop recording manually
  const stopRecording = () => {
    isHandingOverRef.current = false;
    setRecordingState('stopped');
    recordingStateRef.current = 'stopped';

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setVolumeLevel(0);
  };

  // Reset / Discard recording
  const resetRecording = () => {
    cleanupAudio();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setRecordingState('idle');
    recordingStateRef.current = 'idle';
    setCurrentChunkSeconds(0);
    setTotalSessionSeconds(0);
    setCurrentPartNumber(1);
    setPartsProcessedCount(0);
    setAudioBlob(null);
    setAudioUrl(null);
    setVolumeLevel(0);
    setErrorMessage(null);
    setMicPermissionDenied(false);
  };

  // Manual trigger for remaining audio chunk after stop
  const handleFinalizeAndAnalyze = async () => {
    if (!audioBlob) {
      setErrorMessage("Aucun audio enregistré à analyser.");
      return;
    }

    if (audioBlob.size < 1200) {
      setErrorMessage("L'enregistrement est trop court (minimum 2 secondes).");
      return;
    }

    dispatchChunkForAnalysis(
      audioBlob,
      Math.max(2, currentChunkSeconds),
      currentPartNumber,
      sessionId || sessionIdRef.current,
      audioMimeType
    );
  };

  // File upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage("Fichier audio trop lourd (maximum 50 Mo).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const raw = reader.result as string;
      const cleanBase64 = raw.includes(';base64,') ? raw.split(';base64,')[1] : raw;
      const cleanMime = (file.type || 'audio/mp3').split(';')[0].trim();
      const estimatedSec = Math.min(300, Math.max(10, Math.round(file.size / 32000)));
      onAnalyzeAudio(cleanBase64, cleanMime, estimatedSec, 1, 'file_' + Date.now());
    };
    reader.readAsDataURL(file);
  };

  // Helpers
  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const remainingSeconds = Math.max(0, maxChunkSeconds - currentChunkSeconds);
  const progressPercent = Math.min(100, (currentChunkSeconds / maxChunkSeconds) * 100);

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Configuration directe de la Durée (1 à 5 min) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden ring-1 ring-amber-500/20">
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/25">
              <Clock className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  Paramétrer la durée de l'enregistrement
                </h3>
                <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 shadow-sm">
                  {chunkDurationMinutes} min active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Synthèse automatique de la discussion dès la durée choisie
              </p>
            </div>
          </div>

          <button
            onClick={() => (onOpenSettingsModal ? onOpenSettingsModal() : setShowSettingsModal(true))}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm ml-auto"
            title="Consulter l'ensemble des paramètres"
          >
            <Settings2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Tous les paramètres</span>
          </button>
        </div>

        {/* 1, 2, 3, 4, 5 min quick selector buttons */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold">Cliquez pour choisir la durée d'enregistrement :</span>
            <span className="text-[11px] text-amber-400 font-mono font-medium">1 à 5 minutes</span>
          </div>
          <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
            {[1, 2, 3, 4, 5].map((m) => {
              const isSelected = chunkDurationMinutes === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSetChunkDuration(m)}
                  disabled={recordingState === 'recording'}
                  className={`py-3 sm:py-3.5 px-2 rounded-2xl text-xs sm:text-sm font-bold font-mono transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 font-black scale-[1.03]'
                      : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:text-white'
                  } ${recordingState === 'recording' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="text-base sm:text-xl font-black leading-tight">{m}</span>
                  <span className="text-[10px] uppercase font-sans font-semibold">min</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
          <span className="flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5 text-orange-400" />
            <span>Découpage continu : <strong className={continuousSegmenting ? 'text-emerald-400' : 'text-slate-400'}>{continuousSegmenting ? 'Oui (automatique)' : 'Non (arrêt à terme)'}</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mode discret : <strong className={autoStealthOnStart ? 'text-emerald-400' : 'text-slate-400'}>{autoStealthOnStart ? 'Activé' : 'Désactivé'}</strong></span>
          </span>
        </div>
      </div>

      {/* Notice & Safety Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 flex items-start justify-between gap-3 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-100">
              Discrétion & Synthèse Automatique
            </p>
            <p className="text-slate-400 leading-relaxed">
              Tranches configurées de <strong className="text-amber-300">{chunkDurationMinutes} min</strong> avec découpage automatique continu et synthèse instantanée en résumé et points clés.
            </p>
          </div>
        </div>

        {/* Settings button */}
        <button
          onClick={() => (onOpenSettingsModal ? onOpenSettingsModal() : setShowSettingsModal(true))}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer shrink-0"
          title="Paramètres de durée et mode discret"
        >
          <Settings2 className="w-4 h-4 text-amber-400" />
        </button>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Paramètres d'enregistrement</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {/* Chunk Duration Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Durée par tranche / découpage automatique</span>
              </label>
              <p className="text-[11px] text-slate-400 leading-normal">
                Choisissez la durée d'une partie (1 à 5 minutes). À chaque échéance, la partie est automatiquement synthétisée en résumé et points clés.
              </p>
              <div className="grid grid-cols-5 gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((m) => (
                  <button
                    key={m}
                    onClick={() => handleSetChunkDuration(m)}
                    className={`py-2.5 rounded-xl text-xs font-bold font-mono transition cursor-pointer ${
                      chunkDurationMinutes === m
                        ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/50'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {m} min
                  </button>
                ))}
              </div>
            </div>

            {/* Continuous chunking toggle */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-orange-400" />
                  <span>Découpage continu en parties</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  Si la conversation continue, l'enregistrement se découpe automatiquement en Partie 1, Partie 2... sans interruption.
                </p>
              </div>
              <input
                type="checkbox"
                checked={continuousSegmenting}
                onChange={(e) => handleToggleContinuous(e.target.checked)}
                className="w-5 h-5 accent-amber-500 mt-1 cursor-pointer"
              />
            </div>

            {/* Auto-stealth toggle */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Camouflage immédiat (Mode Discret)</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  Bascule instantanément sur une façade anodine (Notes/Mémos) dès le clic sur Enregistrer. Aucun symbole visible d'enregistrement.
                </p>
                <p className="text-[10px] text-amber-300/90 font-medium pt-1">
                  💡 Un triple-clic n'importe où sur l'écran camouflé permet de revenir à la façade de départ.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoStealthOnStart}
                onChange={(e) => handleToggleAutoStealth(e.target.checked)}
                className="w-5 h-5 accent-amber-500 mt-1 cursor-pointer"
              />
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
            >
              Enregistrer les préférences
            </button>
          </div>
        </div>
      )}

      {/* Main Recording Console */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header / Step indicator */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/60 mb-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold ring-1 ring-amber-500/40">
              A
            </span>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-300">
              Enregistrement & Synthèse
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Tranches de {chunkDurationMinutes} min
            </span>

            {/* Quick stealth button if already recording */}
            {recordingState === 'recording' && onEnterStealth && (
              <button
                onClick={onEnterStealth}
                className="py-1 px-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 border border-slate-700 transition cursor-pointer"
                title="Passer en mode discret (façade de notes)"
              >
                <EyeOff className="w-3 h-3 text-emerald-400" />
                <span>Camoufler</span>
              </button>
            )}
          </div>
        </div>

        {/* Timer & Gauge */}
        <div className="text-center py-4 space-y-3">
          <div className="inline-flex items-baseline gap-2">
            <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white drop-shadow-sm">
              {formatTime(currentChunkSeconds)}
            </span>
            <span className="text-sm font-medium text-slate-400 font-mono">
              / {formatTime(maxChunkSeconds)}
            </span>
          </div>

          {/* Part status indicator */}
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
            {recordingState === 'recording' ? (
              <>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold font-mono">
                  Partie {currentPartNumber}
                </span>
                <span>• Temps restant dans cette partie :</span>
                <span className="font-mono font-semibold text-amber-400">
                  {formatTime(remainingSeconds)}
                </span>
              </>
            ) : (
              <span>Durée sélectionnée : {chunkDurationMinutes} minute{chunkDurationMinutes > 1 ? 's' : ''}</span>
            )}
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

          {/* Total session info */}
          {totalSessionSeconds > 0 && (
            <p className="text-[11px] text-slate-500 font-mono">
              Temps total enregistré : {formatTime(totalSessionSeconds)}
              {partsProcessedCount > 0 && ` • ${partsProcessedCount} partie(s) déjà synthétisée(s)`}
            </p>
          )}
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
              <span>Démarrer l'enregistrement</span>
              {autoStealthOnStart && (
                <span className="text-xs font-normal opacity-90 px-2 py-0.5 rounded-full bg-black/20">
                  (Mode discret actif)
                </span>
              )}
            </button>
          )}

          {recordingState === 'recording' && (
            <div className="space-y-2">
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

              {onEnterStealth && (
                <button
                  onClick={onEnterStealth}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700/60 transition cursor-pointer"
                >
                  <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Basculer sur l'écran discret (Carnet de notes)</span>
                </button>
              )}
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

          {/* Stopped state */}
          {recordingState === 'stopped' && (
            <div className="space-y-3">
              <button
                onClick={handleFinalizeAndAnalyze}
                disabled={isAnalyzing}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98] text-white font-bold text-base flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-5 h-5 text-amber-200" />
                <span>Finaliser et synthétiser en résumé</span>
              </button>

              <button
                onClick={resetRecording}
                disabled={isAnalyzing}
                className="w-full py-3 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:scale-[0.98] text-slate-300 font-medium text-sm flex items-center justify-center gap-2 border border-slate-700/60 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-400" />
                Recommencer un nouvel enregistrement
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
                  Accès au microphone non autorisé
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Autorisez le micro dans la barre d'adresse 🔒 de votre navigateur pour enregistrer en direct, ou utilisez un fichier audio.
                </p>
              </div>
            </div>

            <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => dictaphoneInputRef.current?.click()}
                className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Dictaphone natif</span>
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
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1">
              <Upload className="w-4 h-4 text-amber-400" />
              <span>Importer un fichier audio</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Mémo vocal enregistré au préalable (.mp3, .wav, .m4a, .webm).
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
              Testez immédiatement la synthèse en résumé et points clés sans micro.
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
              title="Négociation au marché"
            >
              🛍️ Marché
            </button>
            <button
              onClick={() => onSelectDemoScenario('taxi')}
              disabled={isAnalyzing}
              className="py-2 px-1 text-center rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-200 border border-slate-700/60 transition cursor-pointer disabled:opacity-40"
              title="Course de taxi"
            >
              🚕 Taxi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
