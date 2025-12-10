import { apiRequest, ApiRequestError } from '../services/api';
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { OnboardingWizard } from '../components/OnboardingWizard';
import { AgentTemplateSelector } from '../components/AgentTemplateSelector';
import { AgentTemplate, getTemplateById } from '../data/agentTemplates';
import { Building, Clock, Target, Calendar, Mic, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { VoiceOnboarding } from '../components/VoiceOnboarding';
import { CalendarIntegration } from '../components/CalendarIntegration';
import { industries } from '../data/industries';

export const OnboardingPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const purchaseId = searchParams.get('purchaseId');
    const planId = searchParams.get('planId');
    const planName = searchParams.get('planName');
    const planPrice = searchParams.get('planPrice');
    
    const [showTemplateSelector, setShowTemplateSelector] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
    const [formData, setFormData] = useState<any>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showVoiceOnboarding, setShowVoiceOnboarding] = useState(false);

    const handleTemplateSelect = (template: AgentTemplate) => {
        setSelectedTemplate(template);
        setFormData({
            companyName: '',
            industry: template.industry,
            city: 'Zürich',
            email: '',
            phone: '',
            language: template.languageCode,
            goals: template.defaultSettings.goals,
            openingHours: template.defaultSettings.openingHours,
            calendarConnected: false,
            recordingConsent: template.defaultSettings.recordingConsent,
            systemPrompt: template.systemPrompt,
            voiceId: template.voiceId,
            modelId: template.modelId,
        });
        setShowTemplateSelector(false);
    };

    const handleCreateAgent = async (finalData: any) => {
        if (!selectedTemplate) return;

        setIsSubmitting(true);
        try {
            const payload: any = {
                businessProfile: {
                    companyName: finalData.companyName,
                    industry: finalData.industry || selectedTemplate.industry,
                    location: {
                        country: 'CH',
                        city: finalData.city || 'Zürich',
                    },
                    contact: {
                        email: finalData.email,
                        ...(finalData.phone && { phone: finalData.phone }),
                    },
                    ...(finalData.openingHours && finalData.openingHours !== '24/7' && {
                        openingHours: { 'Mon-Fri': '08:00-18:00' }
                    }),
                },
                config: {
                    primaryLocale: finalData.language || selectedTemplate.languageCode,
                    fallbackLocales: ['en-US'],
                    recordingConsent: finalData.recordingConsent || false,
                    systemPrompt: finalData.systemPrompt || selectedTemplate.systemPrompt,
                    elevenLabs: {
                        voiceId: finalData.voiceId || selectedTemplate.voiceId,
                        modelId: finalData.modelId || selectedTemplate.modelId,
                    },
                },
                subscription: planId && planName ? {
                    planId: planId,
                    planName: planName,
                    purchaseId: purchaseId || '',
                    purchasedAt: new Date().toISOString(),
                } : undefined,
                voiceCloning: finalData.voiceId && finalData.voiceId !== selectedTemplate.voiceId ? {
                    voiceId: finalData.voiceId,
                    voiceName: finalData.voiceName || 'Custom Voice Clone',
                } : undefined,
                purchaseId: purchaseId || undefined,
            };

            await apiRequest('/agents', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            navigate('/dashboard');
        } catch (error) {
            let errorMessage = "Fehler beim Erstellen des Agents.";
            if (error instanceof ApiRequestError) {
                errorMessage = error.message;
                // Try to extract detailed validation errors
                if (error.details && typeof error.details === 'object') {
                    const details = error.details as any;
                    if (details.errors && Array.isArray(details.errors)) {
                        const validationErrors = details.errors.map((e: any) => 
                            `${e.path?.join('.') || 'field'}: ${e.message}`
                        ).join('\n');
                        errorMessage = `Validierungsfehler:\n${validationErrors}`;
                    }
                }
            }
            console.error('Agent creation error:', error);
            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Template Selection Step
    if (showTemplateSelector) {
        return (
            <div className="min-h-screen bg-background text-white">
                <header className="p-6 border-b border-white/10 flex items-center justify-between relative">
                    <div className="flex-1"></div>
                    <div className="flex-1 flex justify-center">
                        <img 
                          src="/logo-studio-white.png" 
                          alt="AIDevelo Studio" 
                          className="h-8 w-auto object-contain cursor-pointer"
                          onClick={() => navigate('/dashboard')}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.parentElement?.querySelector('.logo-fallback-text');
                            if (fallback) {
                              (fallback as HTMLElement).style.display = 'block';
                            }
                          }}
                        />
                        <span className="logo-fallback-text hidden font-display font-bold text-xl cursor-pointer" onClick={() => navigate('/dashboard')}>
                          AIDevelo Studio
                        </span>
                    </div>
                    <div className="flex-1 flex justify-end items-center gap-4">
                        {planName && planPrice && (
                            <div className="text-sm bg-accent/10 border border-accent/30 rounded-lg px-3 py-1">
                                <span className="text-gray-400">Plan: </span>
                                <span className="font-bold text-accent">{planName}</span>
                            </div>
                        )}
                    </div>
                </header>
                <AgentTemplateSelector
                    onSelectTemplate={handleTemplateSelect}
                    onClose={() => navigate('/dashboard')}
                />
            </div>
        );
    }

    // Voice Onboarding (full screen)
    if (showVoiceOnboarding) {
        return (
            <VoiceOnboarding
                onBack={() => setShowVoiceOnboarding(false)}
                onComplete={(voiceId?: string) => {
                    if (voiceId) {
                        setFormData({ ...formData, voiceId });
                    }
                    setShowVoiceOnboarding(false);
                }}
            />
        );
    }

    // Wizard Steps
    const wizardSteps = [
        {
            id: 'company',
            title: 'Firmendaten',
            component: (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Firmenname *</label>
                        <input
                            type="text"
                            value={formData.companyName || ''}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-accent focus:outline-none"
                            placeholder="z.B. Müller Sanitär AG"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Stadt</label>
                            <input
                                type="text"
                                value={formData.city || ''}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-accent focus:outline-none"
                                placeholder="z.B. Zürich"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Branche</label>
                            <select
                                value={formData.industry || selectedTemplate?.industry || ''}
                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-accent focus:outline-none"
                            >
                                {industries.map((ind) => (
                                    <option key={ind.id} value={ind.value}>
                                        {ind.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">E-Mail *</label>
                        <input
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-accent focus:outline-none"
                            placeholder="info@firma.ch"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Telefon</label>
                        <input
                            type="tel"
                            value={formData.phone || ''}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-accent focus:outline-none"
                            placeholder="+41 44 123 45 67"
                        />
                    </div>
                </div>
            ),
        },
        {
            id: 'hours',
            title: 'Erreichbarkeit',
            component: (
                <div className="space-y-4">
                    <p className="text-gray-400 mb-6">Wann soll der AI Agent Anrufe entgegennehmen?</p>
                    <div className="space-y-3">
                        {['24/7', 'Nur ausserhalb der Öffnungszeiten'].map((option) => (
                            <div
                                key={option}
                                onClick={() => setFormData({ ...formData, openingHours: option })}
                                className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                                    formData.openingHours === option
                                        ? 'border-accent/50 bg-accent/10'
                                        : 'border-white/10 bg-white/5 hover:border-accent/30'
                                }`}
                            >
                                <span className={formData.openingHours === option ? 'font-bold' : ''}>
                                    {option === '24/7' ? '24/7 (Empfohlen)' : option}
                                </span>
                                {formData.openingHours === option && <CheckCircle2 className="text-accent" />}
                            </div>
                        ))}
                    </div>
                </div>
            ),
        },
        {
            id: 'goals',
            title: 'Agent-Ziele',
            component: (
                <div className="space-y-4">
                    <p className="text-gray-400 mb-6">Was ist die Hauptaufgabe Ihres Voice Agents?</p>
                    <div className="grid grid-cols-1 gap-3">
                        {['Terminbuchung & Kalender', 'Lead-Qualifizierung', 'Support & FAQs', 'Bestellannahme'].map((goal) => (
                            <div
                                key={goal}
                                onClick={() => {
                                    const newGoals = (formData.goals || []).includes(goal)
                                        ? (formData.goals || []).filter((g: string) => g !== goal)
                                        : [...(formData.goals || []), goal];
                                    setFormData({ ...formData, goals: newGoals });
                                }}
                                className={`p-4 border rounded-xl cursor-pointer transition-colors ${
                                    (formData.goals || []).includes(goal)
                                        ? 'border-accent/50 bg-accent/10'
                                        : 'border-white/10 bg-white/5 hover:border-accent/30'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span>{goal}</span>
                                    {(formData.goals || []).includes(goal) && <CheckCircle2 className="text-accent" />}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="recordingConsent"
                                checked={formData.recordingConsent || false}
                                onChange={(e) => setFormData({ ...formData, recordingConsent: e.target.checked })}
                                className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-accent focus:ring-accent focus:ring-2"
                            />
                            <label htmlFor="recordingConsent" className="text-sm text-gray-300 cursor-pointer">
                                <span className="font-semibold">Anrufe aufzeichnen (optional)</span>
                                <p className="text-xs text-gray-500 mt-1">
                                    Ich stimme zu, dass Anrufe für Qualitätssicherung und Training aufgezeichnet werden können.
                                </p>
                            </label>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 'calendar',
            title: 'Kalender Integration',
            component: (
                <div className="space-y-4">
                    <p className="text-gray-400 mb-6">Verbinden Sie Ihren Kalender für automatische Buchungen (optional)</p>
                    <CalendarIntegration
                        onConnected={(provider) => {
                            setFormData({ ...formData, calendarConnected: true });
                        }}
                    />
                </div>
            ),
        },
        {
            id: 'voice',
            title: 'Voice Setup',
            component: (
                <div className="space-y-4">
                    <p className="text-gray-400 mb-6">
                        {selectedTemplate && `Template Voice: ${selectedTemplate.voiceId}`}
                    </p>
                    <div className="space-y-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowVoiceOnboarding(true)}
                            className="w-full"
                        >
                            <Mic className="mr-2" />
                            Eigene Stimme klonen (optional)
                        </Button>
                        <p className="text-sm text-gray-400 text-center">
                            Sie können auch später eine eigene Stimme klonen. Das Template verwendet bereits eine vorkonfigurierte Stimme.
                        </p>
                    </div>
                </div>
            ),
        },
        {
            id: 'review',
            title: 'Übersicht',
            component: (
                <div className="space-y-4">
                    <div className="bg-surface rounded-lg border border-white/10 p-6 space-y-3">
                        <div>
                            <span className="text-gray-400 text-sm">Firmenname:</span>
                            <p className="font-medium">{formData.companyName || 'Nicht angegeben'}</p>
                        </div>
                        <div>
                            <span className="text-gray-400 text-sm">Branche:</span>
                            <p className="font-medium">{formData.industry || selectedTemplate?.industry}</p>
                        </div>
                        <div>
                            <span className="text-gray-400 text-sm">Sprache:</span>
                            <p className="font-medium">{formData.language || selectedTemplate?.language}</p>
                        </div>
                        <div>
                            <span className="text-gray-400 text-sm">Ziele:</span>
                            <p className="font-medium">{(formData.goals || []).join(', ') || 'Keine'}</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-400">
                        Überprüfen Sie Ihre Angaben und klicken Sie auf "Abschliessen", um den Agent zu erstellen.
                    </p>
                </div>
            ),
        },
    ];

    return (
        <OnboardingWizard
            steps={wizardSteps}
            onComplete={handleCreateAgent}
            onCancel={() => navigate('/dashboard')}
            initialData={formData}
            autoSave={true}
        />
    );
};
