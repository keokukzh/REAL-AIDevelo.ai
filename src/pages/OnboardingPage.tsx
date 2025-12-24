import { apiRequest, ApiRequestError } from '../services/api';
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../config/navigation';
import { OnboardingWizard } from '../components/OnboardingWizard';
import { AgentTemplateSelector } from '../components/AgentTemplateSelector';
import { AgentTemplate } from '../data/agentTemplates';
import { VoiceOnboarding } from '../components/voiceagent/VoiceOnboarding';
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
        setSubmissionProgress('Tenant wird erstellt...');
        try {
            const { logger } = await import('../lib/logger');
            logger.debug('Starting Supabase tenant setup', { finalData });

            // Step 1: Ensure tenant exists (creates user, org, location, agent_config if needed)
            setSubmissionProgress('Tenant wird initialisiert...');
            const tenantResponse = await apiRequest<{ success: boolean; data: any }>('/v1/agents/default', {
                method: 'POST',
                data: {
                    locationName: finalData.companyName || 'Hauptstandort',
                },
            });

            logger.debug('Tenant setup response', {
                hasSuccess: 'success' in tenantResponse,
                hasData: 'data' in tenantResponse,
            });

            if (!tenantResponse.success || !tenantResponse.data) {
                throw new Error('Tenant-Setup fehlgeschlagen. Bitte versuchen Sie es erneut.');
            }

            const { agent_config, location } = tenantResponse.data;
            if (!agent_config || !agent_config.id) {
                throw new Error('Agent-Config konnte nicht erstellt werden.');
            }

            // Step 2: Update agent config with onboarding data
            setSubmissionProgress('Agent-Konfiguration wird gespeichert...');
            
            // Map onboarding form data to agent config fields
            const configUpdate: any = {
                company_name: finalData.companyName || 'Unser Unternehmen',
                business_type: finalData.industry || selectedTemplate.industry || 'general',
                persona_gender: finalData.voiceId ? (finalData.voiceId.includes('female') ? 'female' : 'male') : 'female',
                persona_age_range: '25-35',
                goals_json: finalData.goals || selectedTemplate.defaultSettings.goals || [],
                services_json: [],
                greeting_template: `Grüezi, hier ist ${finalData.companyName || 'Unser Unternehmen'}. Wie kann ich Ihnen helfen?`,
                booking_required_fields_json: ['name', 'phone', 'service', 'preferredTime', 'timezone'],
                booking_default_duration_min: 30,
                setup_state: 'ready', // Mark as ready after onboarding
            };

            // Add admin test number if provided
            if (finalData.phone) {
                configUpdate.admin_test_number = finalData.phone;
            }

            await apiRequest<{ success: boolean; data: any }>('/v1/dashboard/agent/config', {
                method: 'PATCH',
                data: configUpdate,
            });

            logger.info('Agent config updated successfully', { agentConfigId: agent_config.id });
            setSubmissionProgress('Agent erfolgreich erstellt!');
            await new Promise(resolve => setTimeout(resolve, 500));
            navigate(ROUTES.DASHBOARD);
            
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
