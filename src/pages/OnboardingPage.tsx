import { apiRequest, ApiRequestError } from '../services/api';
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { VoiceOnboarding } from '../components/VoiceOnboarding';
import { OnboardingTaskList, OnboardingTask } from '../components/OnboardingTaskList';
import { OnboardingAIAssistant } from '../components/OnboardingAIAssistant';
import { CalendarIntegration } from '../components/CalendarIntegration';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { CheckCircle2, ChevronRight, Building, Clock, Target, Calendar, Mic } from 'lucide-react';
import { industries, getIndustryById } from '../data/industries';

// Task IDs
type TaskId = 'company' | 'hours' | 'goals' | 'calendar' | 'voice';

export const OnboardingPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const purchaseId = searchParams.get('purchaseId');
    const industryParam = searchParams.get('industry');
    const planId = searchParams.get('planId');
    const planName = searchParams.get('planName');
    const planPrice = searchParams.get('planPrice');
    
    // Get initial industry from query param or default
    const getInitialIndustry = () => {
        if (industryParam) {
            const industry = getIndustryById(industryParam);
            if (industry) return industry.value;
        }
        return 'Handwerk / Sanitär';
    };
    
    const [activeTask, setActiveTask] = useState<TaskId | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [industryDropdownOpen, setIndustryDropdownOpen] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        industry: getInitialIndustry(),
        city: 'Zürich',
        email: '',
        phone: '',
        language: 'de-CH',
        goals: [] as string[],
        openingHours: '', // Initialize as empty - user must explicitly select
        calendarConnected: false,
        recordingConsent: false, // Opt-in for call recording
    });

    // Define tasks
    const [tasks, setTasks] = useState<OnboardingTask[]>([
        {
            id: 'company',
            title: 'Firmendaten eingeben',
            description: 'Geben Sie die wichtigsten Informationen zu Ihrer Firma ein',
            completed: false,
            icon: <Building className="w-5 h-5" />,
        },
        {
            id: 'hours',
            title: 'Öffnungszeiten festlegen',
            description: 'Wann soll der Agent Anrufe entgegennehmen?',
            completed: false,
            icon: <Clock className="w-5 h-5" />,
        },
        {
            id: 'goals',
            title: 'Ziele definieren',
            description: 'Was ist die Hauptaufgabe Ihres Voice Agents?',
            completed: false,
            icon: <Target className="w-5 h-5" />,
        },
        {
            id: 'calendar',
            title: 'Kalender verbinden',
            description: 'Verbinden Sie Ihren Kalender für automatische Buchungen',
            completed: false,
            icon: <Calendar className="w-5 h-5" />,
        },
        {
            id: 'voice',
            title: 'Stimme klonen',
            description: 'Erstellen Sie Ihren digitalen Zwilling',
            completed: false,
            icon: <Mic className="w-5 h-5" />,
        },
    ]);

    // Update task completion status
    useEffect(() => {
        setTasks(prev => prev.map(task => {
            if (task.id === 'company') {
                return { ...task, completed: !!formData.companyName && !!formData.email };
            }
            if (task.id === 'hours') {
                return { ...task, completed: !!formData.openingHours };
            }
            if (task.id === 'goals') {
                return { ...task, completed: formData.goals.length > 0 };
            }
            if (task.id === 'calendar') {
                return { ...task, completed: formData.calendarConnected };
            }
            return task;
        }));
    }, [formData]);

    const getTaskStatus = (taskId: string): 'completed' | 'available' | 'locked' => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return 'locked';
        if (task.completed) return 'completed';
        // Tasks are available in any order (no locking)
        return 'available';
    };

    const handleTaskClick = (taskId: string) => {
        setActiveTask(taskId as TaskId);
    };

    const handleTaskComplete = (taskId: TaskId) => {
        setActiveTask(null);
        // Task completion is handled by useEffect based on formData
    };

    const handleCreateAgent = async () => {
        // Validate that all required tasks are completed
        if (!allTasksCompleted) {
            alert('Bitte vervollständigen Sie alle Aufgaben, bevor Sie den Agent erstellen.');
            return;
        }

        // Validate required fields
        if (!formData.companyName || !formData.email) {
            alert('Bitte füllen Sie alle Pflichtfelder aus (Firmenname und E-Mail).');
            return;
        }

        if (!formData.openingHours) {
            alert('Bitte wählen Sie die Öffnungszeiten aus.');
            return;
        }

        if (formData.goals.length === 0) {
            alert('Bitte wählen Sie mindestens ein Ziel aus.');
            return;
        }

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
                        "Mon-Fri": formData.openingHours === '24/7' ? "00:00-23:59" : formData.openingHours === 'business' ? "08:00-18:00" : "08:00-18:00"
                    }
                },
                config: {
                    primaryLocale: formData.language,
                    fallbackLocales: ['en-US'],
                    recordingConsent: formData.recordingConsent, // Opt-in for call recording
                    elevenLabs: {
                        voiceId: "21m00Tcm4TlvDq8ikWAM",
                        modelId: "eleven_turbo_v2_5"
                    }
                }
            };

            await apiRequest('/agents', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            // Redirect to dashboard
            navigate('/dashboard');
        } catch (error) {
            const errorMessage = error instanceof ApiRequestError 
                ? error.message 
                : "Fehler beim Erstellen des Agents. Bitte versuchen Sie es später.";
            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVoiceFinished = () => {
        // Mark voice task as completed
        setTasks(prev => prev.map(t => t.id === 'voice' ? { ...t, completed: true } : t));
        // Return to main view - don't create agent yet
        // Agent creation should only happen when all tasks are completed
        setActiveTask(null);
    };

    const allTasksCompleted = tasks.every(t => t.completed);

    // Voice onboarding takes full screen
    if (activeTask === 'voice') {
        return (
            <VoiceOnboarding 
                onBack={handleVoiceFinished}
                onComplete={(voiceId?: string, audioData?: string) => {
                    // Navigate to voice edit page after completion
                    if (voiceId) {
                        navigate(`/voice-edit?voiceId=${voiceId}`);
                    } else {
                        handleVoiceFinished();
                    }
                }}
            />
        );
    }

    // Show task form if a task is active (voice is handled separately)
    if (activeTask) {
        return (
            <div className="min-h-screen bg-background text-white flex flex-col">
                <header className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div onClick={() => setActiveTask(null)} className="cursor-pointer flex items-center gap-2">
                        <img src="/main-logo.png" alt="AIDevelo.ai" className="h-8 w-auto object-contain" />
                    </div>
                    <Button variant="outline" onClick={() => setActiveTask(null)} className="text-sm">
                        <ChevronRight size={16} className="mr-2 rotate-180" />
                        Zurück
                    </Button>
                </header>

                <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
                    {activeTask === 'company' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                                <Building className="text-accent" /> Ihre Firma
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Firmenname *</label>
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
                                    <div className="relative">
                                        <label className="block text-sm text-gray-400 mb-1">Branche</label>
                                        <button
                                            type="button"
                                            onClick={() => setIndustryDropdownOpen(!industryDropdownOpen)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-accent outline-none text-left flex items-center justify-between hover:bg-white/10 transition-colors"
                                            aria-label="Branche auswählen"
                                        >
                                            <span>{industries.find(ind => ind.value === formData.industry)?.label || formData.industry}</span>
                                            <ChevronRight 
                                                size={16} 
                                                className={`transform transition-transform ${industryDropdownOpen ? 'rotate-90' : 'rotate-0'}`}
                                            />
                                        </button>
                                        {industryDropdownOpen && (
                                            <>
                                                <div 
                                                    className="fixed inset-0 z-40" 
                                                    onClick={() => setIndustryDropdownOpen(false)}
                                                />
                                                <div className="absolute z-50 w-full mt-1 bg-black border border-white/20 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                                    {industries.map((ind) => (
                                                        <button
                                                            key={ind.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData({...formData, industry: ind.value});
                                                                setIndustryDropdownOpen(false);
                                                            }}
                                                            className={`w-full text-left px-4 py-3 hover:bg-accent/10 transition-colors border-b border-white/5 last:border-0 ${
                                                                formData.industry === ind.value 
                                                                    ? 'bg-accent/20 text-accent font-semibold' 
                                                                    : 'text-white'
                                                            }`}
                                                        >
                                                            {ind.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-white/5">
                                    <h3 className="text-sm font-bold text-gray-300 mb-3">Kontakt für Rückfragen</h3>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">E-Mail *</label>
                                        <input 
                                            type="email" 
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-accent outline-none"
                                            placeholder="info@firma.ch"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <Button onClick={() => handleTaskComplete('company')} variant="primary" className="w-full mt-6">
                                    Speichern <CheckCircle2 size={16} className="ml-2" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {activeTask === 'hours' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                                <Clock className="text-accent" /> Erreichbarkeit
                            </h2>
                            <p className="text-gray-400 mb-6">Wann soll der AI Agent Anrufe entgegennehmen?</p>
                            <div className="space-y-3 mb-8">
                                <div 
                                    onClick={() => setFormData({...formData, openingHours: '24/7'})}
                                    className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                                        formData.openingHours === '24/7' 
                                            ? 'border-accent/50 bg-accent/10' 
                                            : 'border-white/10 bg-white/5 hover:border-accent/30'
                                    }`}
                                >
                                    <span className="font-bold">24/7 (Empfohlen)</span>
                                    {formData.openingHours === '24/7' && <CheckCircle2 className="text-accent" />}
                                </div>
                                <div 
                                    onClick={() => setFormData({...formData, openingHours: 'business'})}
                                    className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                                        formData.openingHours === 'business' 
                                            ? 'border-accent/50 bg-accent/10' 
                                            : 'border-white/10 bg-white/5 hover:border-accent/30'
                                    }`}
                                >
                                    <span>Nur ausserhalb der Öffnungszeiten</span>
                                    {formData.openingHours === 'business' && <CheckCircle2 className="text-accent" />}
                                </div>
                            </div>
                            <Button onClick={() => handleTaskComplete('hours')} variant="primary" className="w-full">
                                Speichern <CheckCircle2 size={16} className="ml-2" />
                            </Button>
                        </motion.div>
                    )}

                    {activeTask === 'goals' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                                <Target className="text-accent" /> Agenten-Ziel
                            </h2>
                            <p className="text-gray-400 mb-6">Was ist die Hauptaufgabe Ihres Voice Agents?</p>
                            <div className="grid grid-cols-1 gap-3 mb-8">
                                {['Terminbuchung & Kalender', 'Lead-Qualifizierung', 'Support & FAQs', 'Bestellannahme'].map((goal) => (
                                    <div 
                                        key={goal}
                                        onClick={() => {
                                            const newGoals = formData.goals.includes(goal)
                                                ? formData.goals.filter(g => g !== goal)
                                                : [...formData.goals, goal];
                                            setFormData({...formData, goals: newGoals});
                                        }}
                                        className={`p-4 border rounded-xl cursor-pointer transition-colors ${
                                            formData.goals.includes(goal)
                                                ? 'border-accent/50 bg-accent/10'
                                                : 'border-white/10 bg-white/5 hover:border-accent/30'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>{goal}</span>
                                            {formData.goals.includes(goal) && <CheckCircle2 className="text-accent" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Button onClick={() => handleTaskComplete('goals')} variant="primary" className="w-full">
                                Speichern <CheckCircle2 size={16} className="ml-2" />
                            </Button>
                            
                            {/* Recording Consent */}
                            <div className="mt-6 pt-6 border-t border-white/10">
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        id="recordingConsent"
                                        checked={formData.recordingConsent}
                                        onChange={(e) => setFormData({...formData, recordingConsent: e.target.checked})}
                                        className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-accent focus:ring-accent focus:ring-2"
                                    />
                                    <label htmlFor="recordingConsent" className="text-sm text-gray-300 cursor-pointer">
                                        <span className="font-semibold">Anrufe aufzeichnen (optional)</span>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Ich stimme zu, dass Anrufe für Qualitätssicherung und Training aufgezeichnet werden können. 
                                            Die Aufzeichnungen werden maximal 90 Tage gespeichert und können jederzeit gelöscht werden.
                                        </p>
                                    </label>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTask === 'calendar' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                                <Calendar className="text-accent" /> Integration
                            </h2>
                            <CalendarIntegration 
                                onConnected={(provider) => {
                                    setFormData({...formData, calendarConnected: true});
                                    handleTaskComplete('calendar');
                                }}
                            />
                        </motion.div>
                    )}
                </main>
            </div>
        );
    }

    // Main task list view
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
            
            <header className="p-6 border-b border-white/10 flex items-center justify-between">
                <div onClick={() => navigate('/')} className="cursor-pointer flex items-center gap-2">
                    <img src="/main-logo.png" alt="AIDevelo.ai" className="h-8 w-auto object-contain" />
                </div>
                <div className="flex items-center gap-4">
                    {planName && planPrice && (
                        <div className="text-sm bg-accent/10 border border-accent/30 rounded-lg px-3 py-1">
                            <span className="text-gray-400">Plan: </span>
                            <span className="font-bold text-accent">{planName}</span>
                            {planPrice !== 'Auf Anfrage' && (
                                <span className="text-gray-400"> ({planPrice} CHF/Monat)</span>
                            )}
                        </div>
                    )}
                    <div className="text-sm text-gray-500">Onboarding</div>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Task List */}
                    <div className="lg:col-span-2">
                        <OnboardingTaskList
                            tasks={tasks}
                            onTaskClick={handleTaskClick}
                            getTaskStatus={getTaskStatus}
                        />

                        {allTasksCompleted && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-8 p-6 bg-green-500/10 border border-green-500/30 rounded-xl"
                            >
                                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                    <CheckCircle2 className="text-green-400" />
                                    Alle Aufgaben abgeschlossen!
                                </h3>
                                <p className="text-gray-400 mb-4">
                                    Sie können jetzt Ihren Agent erstellen und aktivieren.
                                </p>
                                <Button onClick={handleCreateAgent} variant="primary" className="w-full">
                                    Agent erstellen
                                </Button>
                            </motion.div>
                        )}
                    </div>

                    {/* AI Assistant Sidebar */}
                    <div className="lg:col-span-1">
                        <OnboardingAIAssistant 
                            currentTask={activeTask}
                            formData={formData}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};
