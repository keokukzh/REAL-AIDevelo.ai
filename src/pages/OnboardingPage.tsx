import { apiRequest } from '../services/api';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VoiceOnboarding } from '../components/VoiceOnboarding';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { CheckCircle2, ChevronRight, Building, Clock, Target, Calendar } from 'lucide-react';

// Steps for the wizard
type WizardStep = 'company' | 'hours' | 'goals' | 'calendar' | 'voice' | 'success';

export const OnboardingPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<WizardStep>('company');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        industry: 'Handwerk / Sanitär',
        city: 'Zürich',
        email: '',
        phone: '',
        language: 'de-CH',
        goals: [] as string[]
    });

    const nextStep = (next: WizardStep) => setStep(next);

    const handleCreateAgent = async () => {
        try {
            setIsSubmitting(true);
            
            // Construct payload for Backend
            const payload = {
                businessProfile: {
                    companyName: formData.companyName,
                    industry: formData.industry,
                    location: {
                        country: 'CH',
                        city: formData.city
                    },
                    contact: {
                        email: formData.email,
                        phone: formData.phone
                    },
                    openingHours: {
                        "Mon-Fri": "08:00-18:00" // Default for now, can be expanded
                    }
                },
                config: {
                    primaryLocale: formData.language,
                    fallbackLocales: ['en-US'],
                    elevenLabs: {
                        voiceId: "21m00Tcm4TlvDq8ikWAM", // Default Rachel, or dynamic choice
                        modelId: "eleven_turbo_v2_5"
                    }
                }
            };

            await apiRequest('/agents', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            nextStep('success');
        } catch (error) {
            console.error("Agent Creation Failed:", error);
            // In a real app, show error toast
            alert("Fehler beim Erstellen des Agents. Bitte versuchen Sie es später.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Callback when Voice Wizard finishes
    const handleVoiceFinished = () => {
        handleCreateAgent();
    };


    if (step === 'voice') {
        return <VoiceOnboarding onBack={handleVoiceFinished} />;
    }

    return (
        <div className="min-h-screen bg-background text-white flex flex-col">
            {isSubmitting && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="text-center">
                         <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
                         <h2 className="text-2xl font-bold">Erstelle Ihren Agenten...</h2>
                         <p className="text-gray-400">Verbinde mit ElevenLabs...</p>
                    </div>
                </div>
            )}
            
            {/* Header */}
            <header className="p-6 border-b border-white/10 flex items-center justify-between">
                <div onClick={() => navigate('/')} className="cursor-pointer flex items-center gap-2">
                     <span className="font-display font-bold text-xl">AIDevelo.ai</span>
                </div>
                <div className="text-sm text-gray-500">Setup Wizard</div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
                <div className="mb-8">
                    {/* Progress Indicator */}
                    <div className="flex items-center justify-between mb-2">
                        {['Firmendaten', 'Zeiten', 'Ziele', 'Kalender'].map((label, i) => (
                            <div key={i} className={`text-xs font-medium ${['company', 'hours', 'goals', 'calendar', 'voice', 'success'].indexOf(step) >= i ? 'text-accent' : 'text-gray-600'}`}>{label}</div>
                        ))}
                    </div>
                    <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                        <motion.div 
                            className="h-full bg-accent"
                            initial={{ width: 0 }}
                            animate={{ width: `${(['company', 'hours', 'goals', 'calendar', 'voice', 'success'].indexOf(step) + 1) * 20}%` }}
                        />
                    </div>
                </div>

                <AnimatePresence mode='wait'>
                    {step === 'company' && (
                        <motion.div key="company" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3"><Building className="text-accent" /> Ihre Firma</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Firmenname</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-accent outline-none"
                                        placeholder="z.B. Müller Sanitär AG"
                                        value={formData.companyName}
                                        onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Stadt</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-accent outline-none"
                                            placeholder="z.B. Zürich"
                                            value={formData.city}
                                            onChange={(e) => setFormData({...formData, city: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Branche</label>
                                        <select 
                                            value={formData.industry}
                                            onChange={(e) => setFormData({...formData, industry: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-accent outline-none"
                                        >
                                            <option>Handwerk / Sanitär</option>
                                            <option>Ärzte / Gesundheit</option>
                                            <option>Immobilien</option>
                                            <option>Dienstleistung</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="pt-4 border-t border-white/5">
                                    <h3 className="text-sm font-bold text-gray-300 mb-3">Kontakt für Rückfragen</h3>
                                     <div>
                                        <label className="block text-sm text-gray-400 mb-1">E-Mail</label>
                                        <input 
                                            type="email" 
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-accent outline-none"
                                            placeholder="info@firma.ch"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <Button onClick={() => nextStep('hours')} variant="primary" className="w-full mt-6">
                                    Weiter <ChevronRight size={16} />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'hours' && (
                        <motion.div key="hours" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3"><Clock className="text-accent" /> Erreichbarkeit</h2>
                            <p className="text-gray-400 mb-6">Wann soll der AI Agent Anrufe entgegennehmen?</p>
                            
                            <div className="space-y-3 mb-8">
                                <div className="p-4 border border-accent/50 bg-accent/10 rounded-xl flex items-center justify-between cursor-pointer">
                                    <span className="font-bold">24/7 (Empfohlen)</span>
                                    <CheckCircle2 className="text-accent" />
                                </div>
                                <div className="p-4 border border-white/10 bg-white/5 rounded-xl flex items-center justify-between opacity-50">
                                    <span>Nur ausserhalb der Öffnungszeiten</span>
                                </div>
                            </div>
                            
                            <Button onClick={() => nextStep('goals')} variant="primary" className="w-full">
                                Weiter <ChevronRight size={16} />
                            </Button>
                        </motion.div>
                    )}

                    {step === 'goals' && (
                        <motion.div key="goals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3"><Target className="text-accent" /> Agenten-Ziel</h2>
                            <p className="text-gray-400 mb-6">Was ist die Hauptaufgabe Ihres Voice Agents?</p>
                            
                            <div className="grid grid-cols-1 gap-3 mb-8">
                                {['Terminbuchung & Kalender', 'Lead-Qualifizierung', 'Support & FAQs', 'Bestellannahme'].map((goal) => (
                                    <div key={goal} className="p-4 border border-white/10 bg-white/5 rounded-xl hover:border-accent transition-colors cursor-pointer">
                                        {goal}
                                    </div>
                                ))}
                            </div>

                            <Button onClick={() => nextStep('calendar')} variant="primary" className="w-full">
                                Weiter <ChevronRight size={16} />
                            </Button>
                        </motion.div>
                    )}

                    {step === 'calendar' && (
                        <motion.div key="calendar" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3"><Calendar className="text-accent" /> Integration</h2>
                            <p className="text-gray-400 mb-6">Verbinden Sie Ihren Kalender für automatische Buchungen.</p>

                            <div className="flex gap-4 mb-8">
                                <div className="flex-1 p-6 bg-white rounded-xl text-black flex flex-col items-center justify-center gap-2 cursor-pointer hover:scale-105 transition-transform">
                                    <span className="font-bold">Google Calendar</span>
                                </div>
                                <div className="flex-1 p-6 bg-[#0078D4] rounded-xl text-white flex flex-col items-center justify-center gap-2 cursor-pointer hover:scale-105 transition-transform">
                                    <span className="font-bold">Outlook / 365</span>
                                </div>
                            </div>

                            <Button onClick={() => nextStep('voice')} variant="primary" className="w-full">
                                Weiter zur Stimmerstellung <ChevronRight size={16} />
                            </Button>
                        </motion.div>
                    )}

                    {step === 'success' && (
                        <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center pt-10">
                            <div className="w-24 h-24 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                                <CheckCircle2 size={48} className="text-black" />
                            </div>
                            <h2 className="text-4xl font-bold mb-4">Setup abgeschlossen!</h2>
                            <p className="text-xl text-gray-400 mb-8">Ihr Agent wurde erfolgreich konfiguriert und trainiert.</p>
                            <Button onClick={() => navigate('/dashboard')} variant="primary" className="w-full">
                                Zum Dashboard
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};
