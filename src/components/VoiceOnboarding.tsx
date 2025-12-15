import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Check, Play, Square, RefreshCw, Shield, Globe, Lock, Cpu, AlertCircle, Upload } from 'lucide-react';
import { Button } from './ui/Button';
import { aiService } from '../services/aiService';
import { AudioUploadOption } from './AudioUploadOption';
import { logger } from '../lib/logger';

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

interface VoiceOnboardingProps {
    onBack: () => void;
    onComplete?: (voiceId?: string, audioData?: string) => void;
}

export const VoiceOnboarding: React.FC<VoiceOnboardingProps> = ({ onBack, onComplete }) => {
  const [step, setStep] = useState<'intro' | 'recording' | 'upload' | 'processing' | 'result'>('intro');
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
  const audioLevelCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef<boolean>(false); // Ref to track recording state synchronously
  
  // Visualization State
  const [audioVisuals, setAudioVisuals] = useState<number[]>(new Array(30).fill(10));

  // Playback
  const [generatedAudioBase64, setGeneratedAudioBase64] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const totalSentences = 5; // Limiting for demo flow

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop recording if active (use ref for immediate check)
      isRecordingRef.current = false;
      if (mediaRecorderRef.current) {
        try {
          if (mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
      
      // Stop all media tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            // Ignore errors
          }
        });
      }
      
      // Close audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {
          // Ignore errors when closing
        });
      }
      
      // Cancel animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Clear interval
      if (audioLevelCheckIntervalRef.current) {
        clearInterval(audioLevelCheckIntervalRef.current);
        audioLevelCheckIntervalRef.current = null;
      }
    };
  }, []);

  const updateVisuals = () => {
    // Use ref for synchronous check instead of state
    if (analyserRef.current && dataArrayRef.current && isRecordingRef.current) {
        try {
            // @ts-ignore - TypeScript strict mode issue with Uint8Array types
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);
            const newVisuals = Array.from(dataArrayRef.current)
                .slice(0, 30)
                .map((val: number) => {
                    // Enhanced scaling: more sensitive to voice frequencies
                    const scaled = (val / 255) * 100;
                    return Math.max(8, scaled); // Minimum height for visibility
                });
            
            setAudioVisuals(newVisuals);
            
            // Continue animation - always continue if recording
            animationFrameRef.current = requestAnimationFrame(updateVisuals);
        } catch (error) {
            logger.error('Error updating visuals', error);
            // Stop on error
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        }
    } else if (!isRecordingRef.current && animationFrameRef.current) {
        // Stop animation when not recording
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
    }
  };

  const handleStartRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream; // Store stream for cleanup
        
        // Setup Visualization
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 128; // Increased for better frequency resolution
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
        updateVisuals();

        // Setup Recorder
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
        });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            // Update ref immediately to prevent race conditions
            isRecordingRef.current = false;
            
            // Stop tracks
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            if (audioLevelCheckIntervalRef.current) {
                clearInterval(audioLevelCheckIntervalRef.current);
                audioLevelCheckIntervalRef.current = null;
            }
            setAudioVisuals(new Array(30).fill(10)); // Reset visuals

            // Check if we have audio data
            if (audioChunksRef.current.length === 0) {
                setAnalysisStatus("Keine Audio-Daten aufgenommen. Bitte versuchen Sie es erneut.");
                setIsRecording(false);
                return;
            }

            // Use the recorder's mime type for the blob to ensure compatibility
            const mimeType = mediaRecorder.mimeType || 'audio/webm';
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
            
            // Validate audio blob size (should be at least 2KB for a meaningful recording)
            if (audioBlob.size < 2048) {
                setAnalysisStatus("Aufnahme zu kurz. Bitte sprechen Sie länger (mindestens 2-3 Sekunden).");
                isRecordingRef.current = false;
                setIsRecording(false);
                return;
            }
            
            // Close audio context
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(() => {
                    // Ignore errors when closing
                });
            }
            
            processRecording(audioBlob);
        };

        mediaRecorder.onerror = async (event) => {
            logger.error('MediaRecorder error', event as Error);
            isRecordingRef.current = false;
            setAnalysisStatus("Fehler bei der Aufnahme. Bitte versuchen Sie es erneut.");
            setIsRecording(false);
            // Cleanup on error
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            if (audioLevelCheckIntervalRef.current) {
                clearInterval(audioLevelCheckIntervalRef.current);
                audioLevelCheckIntervalRef.current = null;
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => {
                    try {
                        track.stop();
                    } catch (e) {
                        // Ignore
                    }
                });
                streamRef.current = null;
            }
        };

        // Set recording state in both state and ref
        isRecordingRef.current = true;
        setIsRecording(true);
        setAnalysisStatus("Höre zu...");
        
        // Start recording
        mediaRecorder.start(100); // Collect data every 100ms for better responsiveness
        
        // Start visualization loop immediately
        updateVisuals();
        
        // Start audio level monitoring
        audioLevelCheckIntervalRef.current = setInterval(() => {
            if (!isRecordingRef.current) {
                if (audioLevelCheckIntervalRef.current) {
                    clearInterval(audioLevelCheckIntervalRef.current);
                    audioLevelCheckIntervalRef.current = null;
                }
                return;
            }
            
            if (analyserRef.current && dataArrayRef.current) {
                try {
                    // @ts-ignore
                    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
                    const averageVolume = Array.from(dataArrayRef.current)
                        .slice(0, 30)
                        .reduce((sum, val) => sum + val, 0) / 30;
                    
                    // Update status based on audio level
                    if (averageVolume < 3) {
                        setAnalysisStatus("Höre zu... (Bitte sprechen Sie in das Mikrofon)");
                    } else if (averageVolume < 10) {
                        setAnalysisStatus("Höre zu... (Bitte lauter sprechen)");
                    } else {
                        setAnalysisStatus("Höre zu... ✓");
                    }
                } catch (error) {
                    console.error('[VoiceOnboarding] Error checking audio level:', error);
                }
            }
        }, 1000);

    } catch (err) {
        // Handle microphone access errors gracefully
        const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
        setAnalysisStatus("Fehler: Mikrofonzugriff verweigert. Bitte erlauben Sie den Zugriff in Ihren Browsereinstellungen.");
        // Only log in development for debugging
        if ((import.meta as any).env?.DEV) {
            console.warn("Microphone access error:", errorMessage);
        }
    }
  };

  const handleStopRecording = () => {
    // Use ref for immediate check
    if (!isRecordingRef.current && !isRecording) return;
    
    try {
        // Set ref immediately to prevent race conditions
        isRecordingRef.current = false;
        setIsRecording(false);
        setAnalysisStatus("Sende an AI...");
        
        // Stop recording immediately
        const recorder = mediaRecorderRef.current;
        if (recorder) {
            try {
                if (recorder.state === 'recording' || recorder.state === 'paused') {
                    recorder.stop();
                }
            } catch (e) {
                console.warn('[VoiceOnboarding] Error stopping recorder:', e);
            }
        }
        
        // Stop all media tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                try {
                    track.stop();
                } catch (e) {
                    console.warn('[VoiceOnboarding] Error stopping track:', e);
                }
            });
            streamRef.current = null;
        }
        
        // Stop audio visualization
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        
        // Stop audio level monitoring
        if (audioLevelCheckIntervalRef.current) {
            clearInterval(audioLevelCheckIntervalRef.current);
            audioLevelCheckIntervalRef.current = null;
        }
        
        setAudioVisuals(new Array(30).fill(10)); // Reset visuals
        
        // Close audio context (but don't block on it)
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(() => {
                // Ignore errors when closing
            });
        }
    } catch (error) {
        console.error('[VoiceOnboarding] Error stopping recording:', error);
        isRecordingRef.current = false;
        setIsRecording(false);
        setAnalysisStatus("Fehler beim Stoppen. Bitte versuchen Sie es erneut.");
    }
  };

  const processRecording = async (blob: Blob, retryCount = 0) => {
    setAnalysisStatus("Analysiere Audio...");
    
    // Validate audio blob
    if (blob.size < 1024) {
        setAnalysisStatus("Aufnahme zu kurz. Bitte sprechen Sie länger und versuchen Sie es erneut.");
        return;
    }
    
    try {
        // Call AI Service with retry logic
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
                    // Reset metrics for next sentence
                    setMetrics({ clarity: 0, emotion: 'Neutral', dialect: 0 });
                } else {
                    startProcessingPhase();
                }
            }, 1500);
        } else {
            setAnalysisStatus("Bitte wiederholen (Text nicht erkannt). Sprechen Sie deutlich und langsam.");
        }
    } catch (error) {
        // Retry logic for network errors
        const isNetworkError = error instanceof Error && (
            error.message.includes('fetch') || 
            error.message.includes('network') || 
            error.message.includes('Failed to fetch') ||
            error.message.includes('NetworkError')
        );
        
        if (retryCount < 2 && isNetworkError) {
            setAnalysisStatus(`Wiederhole... (${retryCount + 1}/2)`);
            setTimeout(() => {
                processRecording(blob, retryCount + 1);
            }, 2000);
        } else {
            // Final error - allow user to continue or go back
            const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
            setAnalysisStatus("Fehler: Verbindung zum Server fehlgeschlagen. Sie können es erneut versuchen oder später fortfahren.");
            console.error('[VoiceOnboarding] Error processing recording:', errorMessage);
            
            // Show a retry button option
            setTimeout(() => {
                if (analysisStatus?.includes('Fehler')) {
                    // Keep error message visible for user to see
                }
            }, 100);
        }
    }
  };

  const processUploadedAudio = async (blob: Blob) => {
    try {
        setAnalysisStatus("Analysiere hochgeladene Audio-Datei...");
        
        // Process uploaded audio (similar to recorded audio)
        const result = await aiService.analyzeAudio(blob, "Uploaded audio file");
        
        setMetrics({
            clarity: result.clarity || 85,
            emotion: result.emotion || 'Neutral',
            dialect: result.dialect || 80
        });

        // Proceed to processing phase
        await startProcessingPhase();
    } catch (error) {
        console.error('[VoiceOnboarding] Error processing uploaded audio:', error);
        setAnalysisStatus("Fehler beim Verarbeiten der Audio-Datei. Bitte versuchen Sie es erneut.");
        setStep('upload');
    }
  };

  const startProcessingPhase = async () => {
    setStep('processing');
    try {
        // Simulate training time
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Generate result sample using TTS
        const sampleText = "Hallo! Ich bin dein neuer digitaler Zwilling. Ich klinge genau wie du, oder?";
        const audioData = await aiService.generateSpeech(sampleText);
        setGeneratedAudioBase64(audioData || null);
        
        // Generate a mock voiceId (in production, this would come from the API)
        const mockVoiceId = `voice_${Date.now()}`;
        
        setStep('result');
        
        // Call onComplete callback if provided
        if (onComplete) {
            onComplete(mockVoiceId, audioData || undefined);
        }
    } catch (error) {
        // If processing fails, still show result but with error message
        console.error('[VoiceOnboarding] Error in processing phase:', error);
        setStep('result');
        // User can still proceed even if audio generation failed
        if (onComplete) {
            onComplete(undefined, undefined);
        }
    }
  };

  const playGeneratedAudio = async () => {
    if (!generatedAudioBase64) return;
    
    try {
        // Handle both base64 strings and data URLs
        let audioSrc: string;
        if (generatedAudioBase64.startsWith('data:')) {
            audioSrc = generatedAudioBase64;
        } else if (generatedAudioBase64.startsWith('http')) {
            audioSrc = generatedAudioBase64;
        } else {
            // Assume it's base64 and try different formats
            audioSrc = `data:audio/mp3;base64,${generatedAudioBase64}`;
        }
        
        const audio = new Audio(audioSrc);
        audio.onplay = () => setIsPlaying(true);
        audio.onended = () => setIsPlaying(false);
        audio.onerror = (e) => {
            console.error('[VoiceOnboarding] Audio playback error:', e);
            setIsPlaying(false);
            // Try alternative format
            if (!audioSrc.includes('audio/wav')) {
                const altAudio = new Audio(`data:audio/wav;base64,${generatedAudioBase64}`);
                altAudio.onplay = () => setIsPlaying(true);
                altAudio.onended = () => setIsPlaying(false);
                altAudio.play().catch(err => {
                    console.error('[VoiceOnboarding] Alternative audio format also failed:', err);
                    alert('Audio-Wiedergabe fehlgeschlagen. Bitte versuchen Sie es später erneut oder nehmen Sie neu auf.');
                });
            }
        };
        await audio.play();
    } catch (error) {
        console.error('[VoiceOnboarding] Error playing audio:', error);
        setIsPlaying(false);
        alert('Audio-Wiedergabe fehlgeschlagen. Bitte versuchen Sie es später erneut oder nehmen Sie neu auf.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="p-6 flex justify-between items-center z-10 border-b border-white/5 bg-black/50 backdrop-blur-md relative">
        <div className="flex-1"></div>
        <div className="flex-1 flex justify-center">
            <img 
              src="/logo-studio-white.png" 
              alt="AIDevelo Studio" 
              className="h-8 w-auto object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.parentElement?.querySelector('.logo-fallback-text');
                if (fallback) {
                  (fallback as HTMLElement).style.display = 'block';
                }
              }}
            />
            <span className="logo-fallback-text hidden font-display font-bold text-xl">AIDevelo Studio</span>
        </div>
        <div className="flex-1 flex justify-end">
            <button 
                onClick={() => {
                    // Stop recording if active
                    if (isRecording || isRecordingRef.current) {
                        if (confirm('Aufnahme wird beendet. Möchten Sie wirklich zurückgehen?')) {
                            handleStopRecording();
                            // Wait a moment for cleanup, then go back
                            setTimeout(() => {
                                onBack();
                            }, 500);
                        }
                    } else {
                        onBack();
                    }
                }} 
                className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1 rounded hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Zurück zum Onboarding"
                disabled={step === 'processing'}
            >
                {isRecording ? 'Aufnahme beenden & zurück' : 'Schliessen'}
            </button>
        </div>
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

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button onClick={() => setStep('recording')} variant="primary" className="text-lg px-8">
                            <Mic size={20} className="mr-2" />
                            Live aufnehmen
                        </Button>
                        <Button onClick={() => setStep('upload')} variant="outline" className="text-lg px-8">
                            <Upload size={20} className="mr-2" />
                            Datei hochladen
                        </Button>
                    </div>
                    <p className="mt-4 text-xs text-gray-500">Benötigt Mikrofonzugriff oder Audio-Datei • Dauer ca. 2 Min</p>
                </motion.div>
            )}

            {/* PHASE 2A: UPLOAD */}
            {step === 'upload' && (
                <motion.div
                    key="upload"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="w-full max-w-3xl"
                >
                    <AudioUploadOption
                        onUploadComplete={async (blob) => {
                            // Process uploaded audio
                            setStep('processing');
                            await processUploadedAudio(blob);
                        }}
                        onCancel={() => setStep('intro')}
                    />
                </motion.div>
            )}

            {/* PHASE 2B: RECORDING */}
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

                        {/* Visualization Area - Enhanced */}
                        <div className="h-32 flex flex-col items-center justify-center mb-4">
                            <div className="flex items-end justify-center gap-1 h-24 w-full">
                                 {audioVisuals.map((height, i) => (
                                    <motion.div 
                                       key={i}
                                       className={`w-2 rounded-full transition-colors ${
                                           isRecording 
                                               ? height > 20 
                                                   ? 'bg-green-400' 
                                                   : height > 10 
                                                   ? 'bg-accent' 
                                                   : 'bg-gray-600'
                                               : 'bg-gray-700'
                                       }`}
                                       animate={{ height: `${height}px` }}
                                       transition={{ duration: 0.05, ease: 'easeOut' }}
                                    />
                                 ))}
                            </div>
                            
                            {/* Audio Level Indicator */}
                            {isRecording && (
                                <div className="mt-2 flex items-center gap-2 text-xs">
                                    <div className={`w-2 h-2 rounded-full ${
                                        audioVisuals.reduce((sum, val) => sum + val, 0) / audioVisuals.length > 15
                                            ? 'bg-green-400 animate-pulse'
                                            : 'bg-yellow-400 animate-pulse'
                                    }`} />
                                    <span className="text-gray-400">
                                        {audioVisuals.reduce((sum, val) => sum + val, 0) / audioVisuals.length > 15
                                            ? 'Audio erkannt ✓'
                                            : 'Bitte lauter sprechen...'}
                                    </span>
                                </div>
                            )}
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
                    <div className="flex flex-col items-center gap-4">
                        <motion.button
                            whileHover={{ scale: isRecording ? 1.05 : 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={isRecording ? handleStopRecording : handleStartRecording}
                            disabled={!!analysisStatus && !analysisStatus.includes('Fehler') && !analysisStatus.includes('wiederholen') && !analysisStatus.includes('Höre') && !analysisStatus.includes('Sende') && !analysisStatus.includes('Analysiere')}
                            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)] ${
                                isRecording 
                                    ? 'bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-pulse cursor-pointer hover:bg-red-600 active:bg-red-700' 
                                    : 'bg-white text-black hover:bg-gray-200 cursor-pointer active:bg-gray-300'
                            } disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none`}
                            aria-label={isRecording ? "Aufnahme stoppen" : "Aufnahme starten"}
                        >
                            {isRecording ? <Square fill="currentColor" size={32} /> : <Mic fill="currentColor" size={32} />}
                        </motion.button>
                        
                        {isRecording && (
                            <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-sm text-gray-400 animate-pulse"
                            >
                                Klicken Sie auf den roten Button zum Stoppen
                            </motion.p>
                        )}
                        
                        {/* Error retry button */}
                        {analysisStatus?.includes('Fehler') && !isRecording && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setAnalysisStatus(null);
                                    setCurrentSentenceIndex(0);
                                    setMetrics({ clarity: 0, emotion: 'Neutral', dialect: 0 });
                                }}
                                className="mt-2"
                            >
                                <RefreshCw size={16} className="mr-2" />
                                Erneut versuchen
                            </Button>
                        )}
                    </div>
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
                        <Button 
                            variant="primary" 
                            onClick={() => {
                                // Navigate to voice edit page or call onBack
                                if (onComplete) {
                                    const mockVoiceId = `voice_${Date.now()}`;
                                    onComplete(mockVoiceId, generatedAudioBase64 || undefined);
                                } else {
                                    onBack();
                                }
                            }} 
                            className="w-full justify-center"
                        >
                            Voice Clone bearbeiten & testen
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={() => { 
                                setStep('recording'); 
                                setCurrentSentenceIndex(0); 
                                setMetrics({clarity:0, emotion:'Neutral', dialect:0});
                                setGeneratedAudioBase64(null);
                            }} 
                            className="w-full justify-center"
                        >
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