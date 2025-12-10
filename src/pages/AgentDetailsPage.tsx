import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest, ApiRequestError } from '../services/api';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { 
    Phone, 
    Settings, 
    Play, 
    RefreshCw, 
    Activity, 
    ArrowLeft,
    CheckCircle,
    Clock,
    XCircle,
    Building,
    Calendar,
    Mail,
    Globe,
    BarChart,
    FileText,
    Mic,
    Zap
} from 'lucide-react';
import { ConfigurationTab } from '../components/agent/ConfigurationTab';
import { RAGManagementTab } from '../components/agent/RAGManagementTab';
import { AnalyticsTab } from '../components/agent/AnalyticsTab';
import { CallHistoryTab } from '../components/agent/CallHistoryTab';

interface Agent {
    id: string;
    elevenLabsAgentId?: string;
    businessProfile: {
        companyName: string;
        industry: string;
        website?: string;
        location: {
            country: string;
            city: string;
        };
        contact: {
            phone: string;
            email: string;
        };
        openingHours?: Record<string, string>;
    };
    config: {
        primaryLocale: string;
        fallbackLocales: string[];
        recordingConsent?: boolean;
        systemPrompt?: string;
        elevenLabs: {
            voiceId: string;
            modelId: string;
        };
    };
    subscription?: {
        planId: string;
        planName: string;
        purchaseId: string;
        purchasedAt: string;
        status: string;
    };
    telephony?: {
        phoneNumber?: string;
        phoneNumberId?: string;
        status: 'unassigned' | 'assigned' | 'active' | 'inactive';
        assignedAt?: string;
    };
    voiceCloning?: {
        voiceId?: string;
        voiceName?: string;
        audioUrl?: string;
        createdAt?: string;
    };
    status: 'draft' | 'configuring' | 'production_ready' | 'inactive' | 'pending_activation' | 'active' | 'live';
    createdAt: string;
    updatedAt: string;
}

type TabId = 'overview' | 'configuration' | 'voice' | 'rag' | 'analytics' | 'calls' | 'integrations';

interface Tab {
    id: TabId;
    label: string;
    icon: React.ReactNode;
}

const tabs: Tab[] = [
    { id: 'overview', label: 'Übersicht', icon: <BarChart size={18} /> },
    { id: 'configuration', label: 'Konfiguration', icon: <Settings size={18} /> },
    { id: 'voice', label: 'Voice & Sprache', icon: <Mic size={18} /> },
    { id: 'rag', label: 'RAG & Wissen', icon: <FileText size={18} /> },
    { id: 'analytics', label: 'Analytics', icon: <Activity size={18} /> },
    { id: 'calls', label: 'Call History', icon: <Phone size={18} /> },
    { id: 'integrations', label: 'Integrationen', icon: <Zap size={18} /> },
];

export const AgentDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [agent, setAgent] = useState<Agent | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabId>('overview');

    useEffect(() => {
        if (id) {
            fetchAgent();
        }
    }, [id]);

    const fetchAgent = async () => {
        try {
            const res = await apiRequest<{ data: Agent }>(`/agents/${id}`);
            setAgent(res.data);
        } catch (error) {
            console.error('Failed to fetch agent:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        if (!id) return;
        setSyncing(true);
        try {
            await apiRequest(`/sync/agents/${id}`, { method: 'POST' });
            await fetchAgent();
        } catch (error) {
            // Error handling
        } finally {
            setSyncing(false);
        }
    };

    const handleActivate = async () => {
        if (!id) return;
        try {
            await apiRequest(`/agents/${id}/activate`, { method: 'PATCH' });
            await fetchAgent();
        } catch (error) {
            // Error handling
        }
    };

    const handleTestAgent = () => {
        if (!agent?.elevenLabsAgentId) {
            return;
        }
        window.open(`https://elevenlabs.io/app/talk-to?agent_id=${agent.elevenLabsAgentId}`, '_blank');
    };

    const getStatusBadge = (status: Agent['status']) => {
        const badges = {
            live: { icon: CheckCircle, color: 'bg-green-500/20 text-green-400', text: 'LIVE' },
            active: { icon: CheckCircle, color: 'bg-green-500/20 text-green-400', text: 'AKTIV' },
            pending_activation: { icon: Clock, color: 'bg-yellow-500/20 text-yellow-400', text: 'WARTEND' },
            inactive: { icon: XCircle, color: 'bg-gray-500/20 text-gray-400', text: 'INAKTIV' },
            draft: { icon: Clock, color: 'bg-yellow-500/20 text-yellow-400', text: 'ENTWURF' },
            configuring: { icon: Clock, color: 'bg-yellow-500/20 text-yellow-400', text: 'KONFIGURIEREN' },
            production_ready: { icon: CheckCircle, color: 'bg-blue-500/20 text-blue-400', text: 'BEREIT' },
        };
        const badge = badges[status] || badges.inactive;
        const Icon = badge.icon;
        return (
            <div className={`px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 ${badge.color}`}>
                <Icon size={16} />
                {badge.text}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-white flex items-center justify-center">
                <RefreshCw className="animate-spin text-accent" size={32} />
            </div>
        );
    }

    if (!agent) {
        return (
            <div className="min-h-screen bg-background text-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-400 mb-4">Agent nicht gefunden.</p>
                    <Button variant="outline" onClick={() => navigate('/dashboard')}>
                        Zurück zum Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-white">
            <header className="p-6 border-b border-white/10 flex items-center justify-between bg-surface/50 backdrop-blur-md sticky top-0 z-50 relative">
                <div className="flex-1 flex items-center">
                    <Button variant="outline" onClick={() => navigate('/dashboard')} className="p-2">
                        <ArrowLeft size={20} />
                    </Button>
                </div>
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
                <div className="flex-1 flex justify-end items-center gap-3">
                    {getStatusBadge(agent.status)}
                    <Button variant="outline" onClick={handleSync} disabled={syncing}>
                        <RefreshCw size={16} className={`mr-2 ${syncing ? 'animate-spin' : ''}`} />
                        Sync
                    </Button>
                </div>
            </header>

            <main className="container mx-auto p-6 md:p-12 max-w-7xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold font-display mb-2">{agent.businessProfile.companyName}</h1>
                    <p className="text-gray-400">{agent.businessProfile.industry}</p>
                </div>

                {/* Tabs */}
                <div className="border-b border-white/10 mb-6">
                    <div className="flex gap-2 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'border-accent text-accent'
                                        : 'border-transparent text-gray-400 hover:text-white'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                    {activeTab === 'overview' && (
                        <OverviewTab agent={agent} onTest={handleTestAgent} onActivate={handleActivate} />
                    )}
                    {activeTab === 'configuration' && agent && (
                        <ConfigurationTab 
                            agent={agent} 
                            onSave={async (updates) => {
                                try {
                                    await apiRequest(`/agents/${id}`, {
                                        method: 'PATCH',
                                        body: JSON.stringify(updates),
                                    });
                                    await fetchAgent();
                                } catch (error) {
                                    console.error('Failed to save:', error);
                                }
                            }}
                        />
                    )}
                    {activeTab === 'voice' && (
                        <div className="text-center py-12 text-gray-400">
                            Voice & Sprache Tab - Wird implementiert
                        </div>
                    )}
                    {activeTab === 'rag' && id && (
                        <RAGManagementTab agentId={id} />
                    )}
                    {activeTab === 'analytics' && id && (
                        <AnalyticsTab agentId={id} />
                    )}
                    {activeTab === 'calls' && id && (
                        <CallHistoryTab agentId={id} />
                    )}
                    {activeTab === 'integrations' && (
                        <div className="text-center py-12 text-gray-400">
                            Integrationen Tab - Wird implementiert
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

// Overview Tab Component
const OverviewTab: React.FC<{
    agent: Agent;
    onTest: () => void;
    onActivate: () => void;
}> = ({ agent, onTest, onActivate }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface rounded-2xl border border-white/10 p-6"
                >
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Building size={20} />
                        Firmenprofil
                    </h2>
                    <div className="space-y-3">
                        <div>
                            <span className="text-gray-400 text-sm">Standort:</span>
                            <p className="font-medium">{agent.businessProfile.location.city}, {agent.businessProfile.location.country}</p>
                        </div>
                        <div>
                            <span className="text-gray-400 text-sm">E-Mail:</span>
                            <p className="font-medium flex items-center gap-2">
                                <Mail size={14} />
                                {agent.businessProfile.contact.email}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-400 text-sm">Telefon:</span>
                            <p className="font-medium flex items-center gap-2">
                                <Phone size={14} />
                                {agent.businessProfile.contact.phone}
                            </p>
                        </div>
                        {agent.businessProfile.website && (
                            <div>
                                <span className="text-gray-400 text-sm">Website:</span>
                                <p className="font-medium flex items-center gap-2">
                                    <Globe size={14} />
                                    <a href={agent.businessProfile.website} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                                        {agent.businessProfile.website}
                                    </a>
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface rounded-2xl border border-white/10 p-6"
                >
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Settings size={20} />
                        Konfiguration
                    </h2>
                    <div className="space-y-3">
                        <div>
                            <span className="text-gray-400 text-sm">Sprache:</span>
                            <p className="font-medium">{agent.config.primaryLocale}</p>
                        </div>
                        <div>
                            <span className="text-gray-400 text-sm">Voice ID:</span>
                            <p className="font-medium font-mono text-sm">{agent.config.elevenLabs.voiceId}</p>
                        </div>
                        <div>
                            <span className="text-gray-400 text-sm">Modell:</span>
                            <p className="font-medium">{agent.config.elevenLabs.modelId}</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface rounded-2xl border border-white/10 p-6"
                >
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Phone size={20} />
                        Telefonie
                    </h2>
                    {agent.telephony?.phoneNumber ? (
                        <div className="space-y-3">
                            <div>
                                <span className="text-gray-400 text-sm">Telefonnummer:</span>
                                <p className="font-medium text-lg">{agent.telephony.phoneNumber}</p>
                            </div>
                            <div>
                                <span className="text-gray-400 text-sm">Status:</span>
                                <p className={`font-medium ${
                                    agent.telephony.status === 'active' ? 'text-green-400' : 'text-gray-400'
                                }`}>
                                    {agent.telephony.status === 'active' ? 'Aktiv' : 'Zugewiesen'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">Keine Telefonnummer zugewiesen</p>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface rounded-2xl border border-white/10 p-6"
                >
                    <h2 className="text-xl font-bold mb-4">Aktionen</h2>
                    <div className="space-y-3">
                        {(agent.status === 'inactive' || agent.status === 'pending_activation') && (
                            <Button variant="primary" onClick={onActivate} className="w-full">
                                Agent aktivieren
                            </Button>
                        )}
                        <Button variant="outline" onClick={onTest} className="w-full">
                            <Play size={16} className="mr-2" />
                            Agent testen
                        </Button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
