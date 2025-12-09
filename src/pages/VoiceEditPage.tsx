import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Play, Square, Mic, ArrowLeft, Check, RefreshCw, Settings, Volume2 } from 'lucide-react';
import { apiRequest, ApiRequestError } from '../services/api';

export const VoiceEditPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const voiceId = searchParams.get('voiceId');
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [testText, setTestText] = useState("Hallo! Ich bin dein neuer digitaler Zwilling. Ich klinge genau wie du, oder?");
    const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
    const [audioVisuals, setAudioVisuals] = useState<number[]>(new Array(30).fill(5));
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Sample test phrases
    const samplePhrases = [
        "Hallo! Ich bin dein neuer digitaler Zwilling. Ich klinge genau wie du, oder?",
        "Herzlich willkommen. Schön, dass Sie anrufen.",
        "Guten Tag, wie kann ich Ihnen helfen?",
        "Vielen Dank für Ihren Anruf. Ich leite Sie gerne weiter.",
        "Entschuldigung, der gewünschte Mitarbeiter ist gerade nicht erreichbar. Kann ich eine Nachricht entgegennehmen?"
    ];

    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const updateVisuals = () => {
        if (audioRef.current && isPlaying && !audioRef.current.paused) {
            try {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const analyser = audioContext.createAnalyser();
                const source = audioContext.createMediaElementSource(audioRef.current);
                source.connect(analyser);
                analyser.fftSize = 64;
                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                
                const animate = () => {
                    if (!isPlaying || audioRef.current?.paused) {
                        setAudioVisuals(new Array(30).fill(5));
                        return;
                    }
                    analyser.getByteFrequencyData(dataArray);
                    const newVisuals = Array.from(dataArray)
                        .slice(0, 30)
                        .map((val: number) => Math.max(5, (val / 255) * 30));
                    setAudioVisuals(newVisuals);
                    animationFrameRef.current = requestAnimationFrame(animate);
                };
                animate();
            } catch (e) {
                // Fallback: simple animation
                const animate = () => {
                    if (!isPlaying || audioRef.current?.paused) {
                        setAudioVisuals(new Array(30).fill(5));
                        return;
                    }
                    setAudioVisuals(prev => prev.map(() => Math.random() * 20 + 5));
                    animationFrameRef.current = requestAnimationFrame(animate);
                };
                animate();
            }
        } else {
            setAudioVisuals(new Array(30).fill(5));
        }
    };

    const handleGenerateTest = async () => {
        if (!testText.trim()) {
            alert('Bitte geben Sie einen Text ein.');
            return;
        }

        setIsGenerating(true);
        try {
            // Call API to generate speech with the cloned voice
            const response = await apiRequest<{ success: boolean; data: { audioUrl?: string; audioBase64?: string } }>(
                '/elevenlabs/generate-speech',
                {
                    method: 'POST',
                    body: JSON.stringify({
                        text: testText,
                        voiceId: voiceId || '21m00Tcm4TlvDq8ikWAM', // Fallback to default
                    }),
                }
            );

            if (response.data.audioBase64) {
                // Use base64 data URL - ElevenLabs returns MP3 format
                setGeneratedAudioUrl(`data:audio/mp3;base64,${response.data.audioBase64}`);
            } else if (response.data.audioUrl) {
                // Fallback to URL if provided
                setGeneratedAudioUrl(response.data.audioUrl);
            } else {
                // This should not happen with proper API response
                console.warn('No audioBase64 or audioUrl in response');
                throw new Error('Keine Audio-Daten in der Antwort erhalten.');
            }
        } catch (error) {
            // Only log full error in development
            if (import.meta.env.DEV) {
                console.error('[VoiceEditPage] Error generating speech:', error);
            }
            if (error instanceof ApiRequestError) {
                // Check if it's a network error (server not running)
                if (error.statusCode === 0 || error.message.includes('Network error') || error.message.includes('Unable to connect')) {
                    alert(
                        'Backend-Server nicht erreichbar!\n\n' +
                        'Bitte starten Sie den Backend-Server:\n' +
                        '1. Öffnen Sie ein Terminal\n' +
                        '2. Navigieren Sie zum "server" Ordner\n' +
                        '3. Führen Sie aus: npm run dev\n\n' +
                        'Der Server sollte auf http://localhost:5000 laufen.'
                    );
                } else {
                    // Show user-friendly error message for other errors
                    const errorMsg = error.message.includes('ELEVENLABS_API_KEY') || error.message.includes('API key')
                        ? 'ElevenLabs API-Schlüssel nicht konfiguriert. Bitte konfigurieren Sie ELEVENLABS_API_KEY in der .env-Datei im server-Ordner.'
                        : error.message.includes('Failed to generate speech')
                        ? 'Fehler bei der Audio-Generierung. Bitte überprüfen Sie Ihre ElevenLabs API-Konfiguration.'
                        : error.message;
                    alert(`Fehler: ${errorMsg}`);
                }
            } else {
                alert('Fehler beim Generieren der Stimme. Bitte versuchen Sie es später erneut.');
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePlayAudio = () => {
        if (!generatedAudioUrl && !audioRef.current) {
            alert('Bitte generieren Sie zuerst eine Test-Audio.');
            return;
        }

        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                    animationFrameRef.current = null;
                }
            } else {
                audioRef.current.play().then(() => {
                    setIsPlaying(true);
                    updateVisuals();
                }).catch((error) => {
                    console.error('[VoiceEditPage] Error playing audio:', error);
                    alert('Fehler beim Abspielen der Audio. Bitte versuchen Sie es erneut.');
                });
            }
        }
    };

    const handleSaveAndContinue = () => {
        // Navigate back to onboarding to continue with agent creation
        navigate('/onboarding');
    };

    const handleRerecord = () => {
        // Navigate back to voice onboarding
        navigate('/onboarding?task=voice');
    };

    return (
        <div className="min-h-screen bg-background text-white flex flex-col">
            {/* Header */}
            <header className="p-6 border-b border-white/10 flex items-center justify-between bg-surface/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="outline" 
                        onClick={() => navigate('/onboarding')}
                        className="text-sm"
                    >
                        <ArrowLeft size={16} className="mr-2" />
                        Zurück
                    </Button>
                    <div className="flex items-center gap-2">
                        <Mic className="text-accent" size={24} />
                        <h1 className="text-xl font-bold">Voice Clone bearbeiten</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        onClick={handleRerecord}
                        className="text-sm"
                    >
                        <RefreshCw size={16} className="mr-2" />
                        Neu aufnehmen
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleSaveAndContinue}
                        className="text-sm"
                    >
                        <Check size={16} className="mr-2" />
                        Speichern & Weiter
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    {/* Success Message */}
                    <div className="text-center">
                        <div className="w-20 h-20 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                            <Check size={40} className="text-black" />
                        </div>
                        <h2 className="text-3xl font-bold font-display mb-2">Voice Clone erstellt!</h2>
                        <p className="text-gray-400">Testen Sie Ihre geklonte Stimme und passen Sie sie an.</p>
                    </div>

                    {/* Audio Player Section */}
                    <div className="bg-surface/50 border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <button
                                onClick={handlePlayAudio}
                                disabled={!generatedAudioUrl && !isGenerating}
                                className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shrink-0 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPlaying ? (
                                    <Square fill="currentColor" size={24} />
                                ) : (
                                    <Play fill="currentColor" size={24} className="ml-1" />
                                )}
                            </button>
                            <div className="flex-1">
                                <div className="text-sm text-accent font-bold mb-2">KI-GENERIERTE STIMME</div>
                                <div className="flex items-end gap-1 h-12">
                                    {audioVisuals.map((height, i) => (
                                        <motion.div
                                            key={i}
                                            className="w-1.5 bg-accent rounded-full"
                                            animate={{ height: `${height}px` }}
                                            transition={{ duration: 0.1 }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Hidden audio element */}
                        {generatedAudioUrl && (
                            <audio
                                ref={audioRef}
                                src={generatedAudioUrl}
                                onEnded={() => {
                                    setIsPlaying(false);
                                    if (animationFrameRef.current) {
                                        cancelAnimationFrame(animationFrameRef.current);
                                        animationFrameRef.current = null;
                                    }
                                    setAudioVisuals(new Array(30).fill(5));
                                }}
                                onError={(e) => {
                                    console.error('[VoiceEditPage] Audio error:', e);
                                    setIsPlaying(false);
                                    alert('Fehler beim Abspielen der Audio.');
                                }}
                            />
                        )}
                    </div>

                    {/* Test Text Input */}
                    <div className="bg-surface/50 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Settings size={20} className="text-accent" />
                            Test-Text eingeben
                        </h3>
                        <textarea
                            value={testText}
                            onChange={(e) => setTestText(e.target.value)}
                            placeholder="Geben Sie einen Text ein, um Ihre geklonte Stimme zu testen..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-white focus:border-accent outline-none min-h-[120px] resize-none"
                        />
                        <div className="mt-4 flex flex-wrap gap-2">
                            {samplePhrases.map((phrase, i) => (
                                <button
                                    key={i}
                                    onClick={() => setTestText(phrase)}
                                    className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 hover:bg-white/10 hover:border-accent/50 transition-colors"
                                >
                                    {phrase.substring(0, 40)}...
                                </button>
                            ))}
                        </div>
                        <Button
                            variant="primary"
                            onClick={handleGenerateTest}
                            disabled={isGenerating || !testText.trim()}
                            className="mt-4 w-full"
                        >
                            {isGenerating ? (
                                <>
                                    <RefreshCw size={16} className="mr-2 animate-spin" />
                                    Generiere Audio...
                                </>
                            ) : (
                                <>
                                    <Volume2 size={16} className="mr-2" />
                                    Audio generieren & abspielen
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Info Section */}
                    <div className="bg-accent/10 border border-accent/30 rounded-2xl p-6">
                        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                            <Check size={20} className="text-accent" />
                            Nächste Schritte
                        </h3>
                        <ul className="space-y-2 text-gray-300">
                            <li>• Testen Sie verschiedene Texte, um die Qualität Ihrer geklonten Stimme zu überprüfen</li>
                            <li>• Wenn Sie zufrieden sind, klicken Sie auf "Speichern & Weiter"</li>
                            <li>• Falls Sie nicht zufrieden sind, können Sie jederzeit neu aufnehmen</li>
                            <li>• Nach dem Speichern können Sie Ihren Voice Agent für Ihr Geschäft einrichten</li>
                        </ul>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

