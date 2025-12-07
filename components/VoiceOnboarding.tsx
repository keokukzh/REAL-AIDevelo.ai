import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Check, Play, Square, RefreshCw, Shield, Globe, Lock, Cpu, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { aiService } from '../services/aiService';

// Phase 3 Data: Sentences tailored for Swiss SMEs
const sentences = [
  "Herzlich willkommen. Schön, dass Sie anrufen.",
  "Einen Moment bitte, ich schaue gleich in meinem Kalender nach.",
  "Wir haben von Montag bis Freitag jeweils von 8 bis 18 Uhr geöffnet.",
  "Es tut mir leid, dass Sie warten mussten.",
  "Das ist gar kein Problem, das können wir gerne so einrichten.",
  "Bitte bringen Sie ihre Unterlagen und den Ausweis mit.",
  "Möchten Sie einen Tisch im Innenbereich oder auf der Terrasse?",
  "Ich verstehe vollkommen, dass das ärgerlich für Sie ist.",
  "Die Kosten für die Erstberatung betragen pauschal 150 Franken.",
  "Hiermit bestätige ich, dass dies meine echte Stimme ist."
];

export const VoiceOnboarding: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [step, setStep] = useState<'intro' | 'recording' | 'processing' | 'result'>('intro');
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);
  
  // Metrics
  const [metrics, setMetrics] = useState({ clarity: 0, emotion: 'Neutral', dialect: 0 });

  // Audio Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Visualization State
  const [audioVisuals, setAudioVisuals] = useState<number[]>(new Array(30).fill(10));

  // Playback
  const [generatedAudioBase64, setGeneratedAudioBase64] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const totalSentences = 5; // Limiting for demo flow

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const updateVisuals = () => {
    if (analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const newVisuals = Array.from(dataArrayRef.current)
            .slice(0, 30)
            .map((val: number) => Math.max(10, (val / 255) * 60)); // Scale to height
        setAudioVisuals(newVisuals);
        animationFrameRef.current = requestAnimationFrame(updateVisuals);
    }
  };

  const handleStartRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Setup Visualization
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
        updateVisuals();

        // Setup Recorder
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            // Stop tracks
            stream.getTracks().forEach(track => track.stop());
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            setAudioVisuals(new Array(30).fill(10)); // Reset visuals

            // Use the recorder's mime type for the blob to ensure compatibility (Safari uses audio/mp4 often)
            const mimeType = mediaRecorder.mimeType || 'audio/webm';
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
            processRecording(audioBlob);
        };

        mediaRecorder.start();
        setIsRecording(true);
        setAnalysisStatus("Höre zu...");

    } catch (err) {
        console.error("Error accessing microphone:", err);
        setAnalysisStatus("Fehler: Mikrofonzugriff verweigert.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        setAnalysisStatus("Sende an AI...");
    }
  };

  const processRecording = async (blob: Blob) => {
    setAnalysisStatus("Analysiere Audio...");
    
    // Call AI Service
    const result = await aiService.analyzeAudio(blob, sentences[currentSentenceIndex]);
    
    setMetrics({
        clarity: result.clarity || 85,
        emotion: result.emotion || 'Neutral',
        dialect: result.dialect || 80
    });

    if (result.match) {
        setAnalysisStatus("Perfekt! ✔️");
        setTimeout(() => {
            if (currentSentenceIndex < totalSentences - 1) {
                setCurrentSentenceIndex(prev => prev + 1);
                setAnalysisStatus(null);
            } else {
                startProcessingPhase();
            }
        }, 1500);
    } else {
        setAnalysisStatus("Bitte wiederholen (Text nicht erkannt).");
    }
  };

  const startProcessingPhase = async () => {
    setStep('processing');
    // Simulate training time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate result sample using TTS
    const sampleText = "Hallo! Ich bin dein neuer digitaler Zwilling. Ich klinge genau wie du, oder?";
    const audioData = await aiService.generateSpeech(sampleText);
    setGeneratedAudioBase64(audioData || null);
    
    setStep('result');
  };

  const playGeneratedAudio = () => {
    if (!generatedAudioBase64) return;
    
    const audio = new Audio(`data:audio/mp3;base64,${generatedAudioBase64}`);
    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.play();
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="p-6 flex justify-between items-center z-10 border-b border-white/5 bg-black/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
            <Cpu className="text-accent" />
            <span className="font-display font-bold text-xl">AIDevelo Voice Studio</span>
        </div>
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-white transition-colors">
            Schliessen
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <AnimatePresence mode='wait'>
            
            {/* PHASE 1: INTRO */}
            {step === 'intro' && (
                <motion.div 
                    key="intro"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="max-w-2xl text-center"
                >
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-[0_0_30px_rgba(0,224,255,0.3)]">
                        <Mic size={40} className="text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold font-display mb-6">Erstellen Sie Ihren <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">Digitalen Zwilling</span>.</h1>
                    <p className="text-xl text-gray-400 mb-10 leading-relaxed">
                        In nur 2 Minuten klonen wir Ihre Stimme. Ihr Agent kann dann Anrufe in Ihrem Namen entgegennehmen – 100% authentisch und sicher.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 text-left">
                        {[
                            { icon: Shield, title: "Datenschutz", desc: "Speicherung in der Schweiz (nDSG)." },
                            { icon: Globe, title: "Mundart", desc: "Optimiert für Schweizer Dialekte." },
                            { icon: Lock, title: "Private Nutzung", desc: "Nur für Ihren persönlichen Agenten." }
                        ].map((item, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
                                <item.icon className="text-accent mb-2" size={24} />
                                <div className="font-bold text-white mb-1">{item.title}</div>
                                <div className="text-xs text-gray-400">{item.desc}</div>
                            </div>
                        ))}
                    </div>

                    <Button onClick={() => setStep('recording')} variant="primary" className="text-lg px-12">
                        Aufnahme starten
                    </Button>
                    <p className="mt-4 text-xs text-gray-500">Benötigt Mikrofonzugriff • Dauer ca. 2 Min</p>
                </motion.div>
            )}

            {/* PHASE 2: RECORDING */}
            {step === 'recording' && (
                <motion.div 
                    key="recording"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="w-full max-w-3xl flex flex-col items-center"
                >
                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-gray-800 rounded-full mb-8 overflow-hidden">
                        <motion.div 
                            className="h-full bg-accent" 
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentSentenceIndex) / totalSentences) * 100}%` }}
                        />
                    </div>

                    <div className="text-sm font-bold text-accent uppercase tracking-widest mb-4">
                        Satz {currentSentenceIndex + 1} von {totalSentences}
                    </div>

                    {/* The Card */}
                    <div className="w-full bg-surface/50 border border-white/10 rounded-3xl p-8 md:p-12 text-center backdrop-blur-md shadow-2xl mb-8 relative overflow-hidden min-h-[300px] flex flex-col justify-center">
                        {isRecording && (
                             <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
                        )}
                        
                        <h2 className="text-2xl md:text-3xl font-medium text-white leading-tight mb-8">
                            "{sentences[currentSentenceIndex]}"
                        </h2>

                        {/* Visualization Area */}
                        <div className="h-24 flex items-end justify-center gap-1 mb-4">
                             {audioVisuals.map((height, i) => (
                                 <motion.div 
                                    key={i}
                                    className={`w-1.5 rounded-full ${isRecording ? 'bg-accent' : 'bg-gray-700'}`}
                                    animate={{ height }}
                                    transition={{ duration: 0.1 }}
                                 />
                             ))}
                        </div>
                        
                        {!isRecording && !analysisStatus && (
                            <div className="text-gray-500 text-sm">Drücken Sie das Mikrofon und lesen Sie den Satz vor.</div>
                        )}

                        {/* Real-time Metrics (Populated by AI Analysis) */}
                        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                            {metrics.clarity > 0 && (
                                <>
                                <div className="text-xs font-mono text-green-400 bg-green-900/20 px-2 py-1 rounded border border-green-500/20">
                                    Klarheit: {metrics.clarity}%
                                </div>
                                <div className="text-xs font-mono text-blue-400 bg-blue-900/20 px-2 py-1 rounded border border-blue-500/20">
                                    Emotion: {metrics.emotion}
                                </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Feedback Status */}
                    <div className="h-8 mb-6">
                        <AnimatePresence>
                            {analysisStatus && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className={`flex items-center gap-2 font-medium ${analysisStatus.includes('Perfekt') ? 'text-green-400' : 'text-accent'}`}
                                >
                                    {analysisStatus.includes('Perfekt') ? <Check size={18} /> : <RefreshCw size={18} className="animate-spin" />}
                                    {analysisStatus}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Controls */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={isRecording ? handleStopRecording : handleStartRecording}
                        disabled={!!analysisStatus && !analysisStatus.includes('Fehler') && !analysisStatus.includes('wiederholen')}
                        className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)] ${isRecording ? 'bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)]' : 'bg-white text-black hover:bg-gray-200'}`}
                    >
                        {isRecording ? <Square fill="currentColor" size={32} /> : <Mic fill="currentColor" size={32} />}
                    </motion.button>
                </motion.div>
            )}

            {/* PHASE 3: PROCESSING */}
            {step === 'processing' && (
                <motion.div 
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center"
                >
                    <div className="relative w-64 h-64 mx-auto mb-12">
                        <div className="absolute inset-0 rounded-full border border-accent/20 animate-[spin_10s_linear_infinite]" />
                        <div className="absolute inset-4 rounded-full border border-primary/20 animate-[spin_15s_linear_infinite_reverse]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div 
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-32 h-32 bg-gradient-to-tr from-primary to-accent rounded-full blur-xl"
                            />
                            <Cpu size={48} className="text-white relative z-10" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">Generiere Neural Voice Model...</h2>
                    <p className="text-gray-400">Analysiere Phoneme • Optimiere Dialekt • Finalisiere Stimmprofil</p>
                </motion.div>
            )}

            {/* PHASE 4: RESULT */}
            {step === 'result' && (
                <motion.div 
                    key="result"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-xl w-full text-center"
                >
                    <div className="w-20 h-20 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                        <Check size={40} className="text-black" />
                    </div>
                    <h2 className="text-4xl font-bold font-display text-white mb-2">Fertig!</h2>
                    <p className="text-gray-400 mb-10">Ihr persönlicher Voice Agent ist bereit für den Einsatz.</p>

                    <div className="bg-surface/50 border border-white/10 rounded-2xl p-6 mb-8 flex items-center gap-4 hover:border-accent/30 transition-colors">
                        <button 
                            onClick={playGeneratedAudio}
                            disabled={!generatedAudioBase64}
                            className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shrink-0 hover:scale-105 transition-transform disabled:opacity-50"
                        >
                            {isPlaying ? <Square fill="currentColor" size={20} /> : <Play fill="currentColor" size={20} className="ml-1" />}
                        </button>
                        <div className="text-left overflow-hidden flex-1">
                            <div className="text-sm text-accent font-bold mb-1">KI-GENERIERTE STIMME</div>
                            <div className="flex items-center gap-1 h-6">
                                {[...Array(30)].map((_, i) => (
                                     <motion.div 
                                        key={i} 
                                        className="w-1 bg-gray-600 rounded-full"
                                        animate={{ height: isPlaying ? [5, Math.random() * 20 + 5, 5] : 5 }}
                                        transition={{ duration: 0.2, repeat: Infinity, delay: i * 0.05 }}
                                     />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <Button variant="primary" onClick={onBack} className="w-full justify-center">
                            In meinen Account speichern
                        </Button>
                        <Button variant="outline" onClick={() => { setStep('recording'); setCurrentSentenceIndex(0); setMetrics({clarity:0, emotion:'Neutral', dialect:0}); }} className="w-full justify-center">
                            Neu aufnehmen
                        </Button>
                    </div>
                </motion.div>
            )}

        </AnimatePresence>
      </main>
    </div>
  );
};