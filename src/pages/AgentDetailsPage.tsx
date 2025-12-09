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
    Globe
} from 'lucide-react';

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

export const AgentDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [agent, setAgent] = useState<Agent | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [availableNumbers, setAvailableNumbers] = useState<Array<{ id: string; number: string; status: string }>>([]);

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
            alert('Fehler beim Laden des Agents.');
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
            alert('Agent erfolgreich synchronisiert!');
        } catch (error) {
            const errorMessage = error instanceof ApiRequestError 
                ? error.message 
                : "Fehler beim Synchronisieren.";
            alert(errorMessage);
        } finally {
            setSyncing(false);
        }
    };

    const handleActivate = async () => {
        if (!id) return;
        try {
            await apiRequest(`/agents/${id}/activate`, { method: 'PATCH' });
            await fetchAgent();
            alert('Agent erfolgreich aktiviert!');
        } catch (error) {
            const errorMessage = error instanceof ApiRequestError 
                ? error.message 
                : "Fehler beim Aktivieren.";
            alert(errorMessage);
        }
    };

    const handleTestAgent = () => {
        if (!agent?.elevenLabsAgentId) {
            alert("Dieser Agent hat noch keine Verknüpfung zu ElevenLabs.");
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
            <header className="p-6 border-b border-white/10 flex items-center justify-between bg-surface/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => navigate('/dashboard')} className="p-2">
                        <ArrowLeft size={20} />
                    </Button>
                    <span className="font-display font-bold text-xl">AIDevelo.ai</span>
                    <span className="text-gray-600">|</span>
                    <span className="text-gray-300 font-medium">Agent Details</span>
                </div>
                <div className="flex items-center gap-3">
                    {getStatusBadge(agent.status)}
                    <Button variant="outline" onClick={handleSync} disabled={syncing}>
                        <RefreshCw size={16} className={`mr-2 ${syncing ? 'animate-spin' : ''}`} />
                        Sync
                    </Button>
                </div>
            </header>

            <main className="container mx-auto p-6 md:p-12 max-w-6xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold font-display mb-2">{agent.businessProfile.companyName}</h1>
                    <p className="text-gray-400">{agent.businessProfile.industry}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Business Profile */}
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
                                {agent.businessProfile.openingHours && (
                                    <div>
                                        <span className="text-gray-400 text-sm">Öffnungszeiten:</span>
                                        <div className="mt-1 space-y-1">
                                            {Object.entries(agent.businessProfile.openingHours).map(([day, hours]) => (
                                                <p key={day} className="text-sm">
                                                    <span className="font-medium">{day}:</span> {hours}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Configuration */}
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
                                <div>
                                    <span className="text-gray-400 text-sm">Anrufaufzeichnung:</span>
                                    <p className="font-medium">{agent.config.recordingConsent ? 'Aktiviert' : 'Deaktiviert'}</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Telephony */}
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
                                    {agent.telephony.assignedAt && (
                                        <div>
                                            <span className="text-gray-400 text-sm">Zugewiesen am:</span>
                                            <p className="font-medium text-sm">
                                                {new Date(agent.telephony.assignedAt).toLocaleDateString('de-CH')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm">Keine Telefonnummer zugewiesen</p>
                            )}
                        </motion.div>

                        {/* Subscription */}
                        {agent.subscription && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-surface rounded-2xl border border-white/10 p-6"
                            >
                                <h2 className="text-xl font-bold mb-4">Abonnement</h2>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-gray-400 text-sm">Plan:</span>
                                        <p className="font-medium">{agent.subscription.planName}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 text-sm">Status:</span>
                                        <p className="font-medium">{agent.subscription.status}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 text-sm">Gekauft am:</span>
                                        <p className="font-medium text-sm">
                                            {new Date(agent.subscription.purchasedAt).toLocaleDateString('de-CH')}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Voice Cloning */}
                        {agent.voiceCloning?.voiceId && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-surface rounded-2xl border border-white/10 p-6"
                            >
                                <h2 className="text-xl font-bold mb-4">Voice Clone</h2>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-gray-400 text-sm">Name:</span>
                                        <p className="font-medium">{agent.voiceCloning.voiceName || 'Custom Voice'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 text-sm">Voice ID:</span>
                                        <p className="font-medium font-mono text-sm">{agent.voiceCloning.voiceId}</p>
                                    </div>
                                    {agent.voiceCloning.createdAt && (
                                        <div>
                                            <span className="text-gray-400 text-sm">Erstellt am:</span>
                                            <p className="font-medium text-sm">
                                                {new Date(agent.voiceCloning.createdAt).toLocaleDateString('de-CH')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Actions */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-surface rounded-2xl border border-white/10 p-6"
                        >
                            <h2 className="text-xl font-bold mb-4">Aktionen</h2>
                            <div className="space-y-3">
                                {(agent.status === 'inactive' || agent.status === 'pending_activation') && (
                                    <Button
                                        variant="primary"
                                        onClick={handleActivate}
                                        className="w-full"
                                    >
                                        Agent aktivieren
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={handleTestAgent}
                                    className="w-full"
                                >
                                    <Play size={16} className="mr-2" />
                                    Agent testen
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleSync}
                                    disabled={syncing}
                                    className="w-full"
                                >
                                    <RefreshCw size={16} className={`mr-2 ${syncing ? 'animate-spin' : ''}`} />
                                    Synchronisieren
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
};

