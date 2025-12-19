import { apiRequest, ApiRequestError } from '../services/api';
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../config/navigation';
import { OnboardingWizard } from '../components/OnboardingWizard';
import { AgentTemplateSelector } from '../components/AgentTemplateSelector';
import { AgentTemplate } from '../data/agentTemplates';
import { VoiceOnboarding } from '../components/VoiceOnboarding';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { CompanyDataStep } from '../components/onboarding/CompanyDataStep';
import { AvailabilityStep } from '../components/onboarding/AvailabilityStep';
import { GoalsStep } from '../components/onboarding/GoalsStep';
import { CalendarStep } from '../components/onboarding/CalendarStep';
import { VoiceStep } from '../components/onboarding/VoiceStep';
import { ReviewStep } from '../components/onboarding/ReviewStep';

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
    const [submissionProgress, setSubmissionProgress] = useState<string>('');
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
        setSubmissionProgress('Agent wird erstellt...');
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

            const { logger } = await import('../lib/logger');
            logger.debug('Creating agent with payload', { payload });
            setSubmissionProgress('Daten werden gesendet...');
            
            const response = await apiRequest<{ success: boolean; data: any }>('/agents', {
                method: 'POST',
                data: payload,
            });

            logger.debug('Agent creation response received', {
                hasSuccess: 'success' in response,
                hasData: 'data' in response,
                responseKeys: Object.keys(response),
                dataKeys: response.data ? Object.keys(response.data) : 'no data'
            });

            if (!response.data || !response.data.id) {
                throw new Error(`Unexpected response format: ${JSON.stringify(response)}`);
            }

            logger.info('Agent creation started', { agentId: response.data.id });
            setSubmissionProgress('Agent wird konfiguriert (dies kann bis zu 30 Sekunden dauern)...');
            
            // Poll for agent status until it's no longer 'creating'
            const agentId = response.data.id;
            let pollingAttempts = 0;
            const maxPollingAttempts = 60; // 60 * 1 second = 60 seconds max
            
            while (pollingAttempts < maxPollingAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between polls
                
                try {
                    const statusResponse = await apiRequest<{ success: boolean; data: any }>(`/agents/${agentId}`, {
                        method: 'GET',
                    });
                    
                    const agentStatus = statusResponse.data.status;
                    logger.debug('Agent status check', { 
                        status: agentStatus, 
                        attempt: pollingAttempts + 1 
                    });
                    
                    if (agentStatus === 'pending_activation') {
                        logger.info('Agent creation completed', { agentId });
                        setSubmissionProgress('Agent erfolgreich erstellt!');
                        await new Promise(resolve => setTimeout(resolve, 500));
                        navigate(ROUTES.DASHBOARD);
                        return;
                    } else if (agentStatus === 'creation_failed') {
                        throw new Error('Agent-Erstellung fehlgeschlagen. Bitte versuchen Sie es erneut.');
                    }
                } catch (pollError) {
                    // Continue polling even if status check fails
                    logger.warn('Status check failed, will retry', { error: pollError });
                }
                
                pollingAttempts++;
            }
            
            // If we timeout, still navigate (agent might complete in background)
            logger.warn('Agent creation timeout - agent may complete in background', { agentId });
            setSubmissionProgress('Agent-Setup wird im Hintergrund abgeschlossen...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            navigate('/dashboard');
            
        } catch (error) {
            const { logger } = await import('../lib/logger');
            let errorMessage = "Fehler beim Erstellen des Agents.";
            if (error instanceof ApiRequestError) {
                errorMessage = error.message;
                logger.error('Agent creation failed - ApiRequestError', error, {
                    statusCode: error.statusCode,
                    details: error.details
                });
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
            } else {
                logger.error('Agent creation failed - unexpected error', error);
                errorMessage = error instanceof Error ? error.message : String(error);
            }
            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
            setSubmissionProgress('');
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

    // Wizard Steps - using extracted components
    const wizardSteps = [
        {
            id: 'company',
            title: 'Firmendaten',
            component: (
                <CompanyDataStep
                    formData={formData}
                    updateFormData={setFormData}
                    selectedTemplate={selectedTemplate}
                />
            ),
        },
        {
            id: 'hours',
            title: 'Erreichbarkeit',
            component: (
                <AvailabilityStep
                    formData={formData}
                    updateFormData={setFormData}
                />
            ),
        },
        {
            id: 'goals',
            title: 'Agent-Ziele',
            component: (
                <GoalsStep
                    formData={formData}
                    updateFormData={setFormData}
                />
            ),
        },
        {
            id: 'calendar',
            title: 'Kalender Integration',
            component: (
                <CalendarStep
                    formData={formData}
                    updateFormData={setFormData}
                />
            ),
        },
        {
            id: 'voice',
            title: 'Voice Setup',
            component: (
                <VoiceStep
                    formData={formData}
                    updateFormData={setFormData}
                    selectedTemplate={selectedTemplate}
                    onOpenVoiceOnboarding={() => setShowVoiceOnboarding(true)}
                />
            ),
        },
        {
            id: 'review',
            title: 'Übersicht',
            component: (
                <ReviewStep
                    formData={formData}
                    selectedTemplate={selectedTemplate}
                />
            ),
        },
    ];

    // Show loading overlay when submitting
    if (isSubmitting) {
        return (
            <div className="min-h-screen bg-background text-white relative">
                <LoadingSpinner 
                    message={submissionProgress || "Agent wird erstellt..."}
                    size="lg"
                    fullScreen={true}
                />
            </div>
        );
    }

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
