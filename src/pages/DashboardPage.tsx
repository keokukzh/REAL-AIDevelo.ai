import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest, ApiRequestError } from '../services/api';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Activity, Phone, Settings, Play, RefreshCw, BarChart, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Agent {
    id: string;
    elevenLabsAgentId?: string;
    businessProfile: {
        companyName: string;
    };
    config: {
        primaryLocale: string;
    };
    subscription?: {
        planId: string;
        planName: string;
    };
    telephony?: {
        phoneNumber?: string;
        phoneNumberId?: string;
        status: 'unassigned' | 'assigned' | 'active' | 'inactive';
    };
    status: 'draft' | 'configuring' | 'production_ready' | 'inactive' | 'pending_activation' | 'active' | 'live';
    lastTestResult?: {
        score: number;
        passed: boolean;
        timestamp: string;
    };
}

export const DashboardPage = () => {
    const navigate = useNavigate();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [activatingAgentId, setActivatingAgentId] = useState<string | null>(null);
    const [availableNumbers, setAvailableNumbers] = useState<Array<{ id: string; number: string; status: string }>>([]);
    const [showActivationModal, setShowActivationModal] = useState(false);

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            const res = await apiRequest<{ data: Agent[] }>('/agents');
            setAgents(res.data);
        } catch (error) {
            // Error handling - in production, use toast notifications
            if (error instanceof ApiRequestError) {
                // Could show user-friendly error message here
            }
            // Silently fail for now - could add error state to show message
        } finally {
            setLoading(false);
        }
    };

    const handleRunDiagnostics = async (agentId: string) => {
        try {
            // Optimistic update or loading state could be added here
            const res = await apiRequest<{ data: { score: number; passed: boolean; timestamp: string } }>(`/tests/${agentId}/run`, { method: 'POST' });
            
            // Update the local agent state with the new result
            setAgents(prev => prev.map(a => 
                a.id === agentId 
                ? { ...a, lastTestResult: res.data } 
                : a
            ));
            
            alert(`Diagnose abgeschlossen! Score: ${res.data.score}%`);
        } catch (error) {
            // Error handling - in production, use toast notifications
            const errorMessage = error instanceof ApiRequestError 
                ? error.message 
                : "Diagnose konnte nicht gestartet werden.";
            alert(errorMessage);
        }
    };

    const handleTestAgent = (agentId?: string) => {
        if (!agentId) {
            alert("Dieser Agent hat noch keine Verknüpfung zu ElevenLabs.");
            return;
        }
        window.open(`https://elevenlabs.io/app/talk-to?agent_id=${agentId}`, '_blank');
    };

    const handleActivateAgent = async (agentId: string, phoneNumberId?: string) => {
        setActivatingAgentId(agentId);
        try {
            const res = await apiRequest<{ success: boolean; data: Agent; message?: string }>(`/agents/${agentId}/activate`, {
                method: 'PATCH',
                body: phoneNumberId ? { phoneNumberId } : undefined,
            });
            
            // Update the local agent state
            setAgents(prev => prev.map(a => 
                a.id === agentId 
                ? { ...a, status: res.data.status, telephony: res.data.telephony } 
                : a
            ));
            
            setShowActivationModal(false);
            setAvailableNumbers([]);
            alert(res.message || 'Agent erfolgreich aktiviert!');
        } catch (error) {
            const errorMessage = error instanceof ApiRequestError 
                ? error.message 
                : "Fehler beim Aktivieren des Agents.";
            alert(errorMessage);
        } finally {
            setActivatingAgentId(null);
        }
    };

    const handleOpenActivationModal = async (agentId: string) => {
        const agent = agents.find(a => a.id === agentId);
        if (!agent) return;

        setShowActivationModal(true);
        setActivatingAgentId(agentId);

        // Fetch available phone numbers for the plan
        try {
            const planId = agent.subscription?.planId || 'starter';
            const res = await apiRequest<{ success: boolean; data: Array<{ id: string; number: string; status: string }> }>(
                `/telephony/numbers?planId=${planId}`
            );
            setAvailableNumbers(res.data);
        } catch (error) {
            console.error('Failed to fetch phone numbers:', error);
            // Continue without phone number selection
        }
    };

    const handleSyncAgent = async (agentId: string) => {
        try {
            await apiRequest(`/sync/agents/${agentId}`, { method: 'POST' });
            // Refresh agents
            fetchAgents();
            alert('Agent erfolgreich synchronisiert!');
        } catch (error) {
            const errorMessage = error instanceof ApiRequestError 
                ? error.message 
                : "Fehler beim Synchronisieren des Agents.";
            alert(errorMessage);
        }
    };

    return (
        <div className="min-h-screen bg-background text-white">
            <header className="p-6 border-b border-white/10 flex items-center justify-between bg-surface/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3">
                     <span onClick={() => navigate('/')} className="font-display font-bold text-xl cursor-pointer">AIDevelo.ai</span>
                     <span className="text-gray-600">|</span>
                     <span className="text-gray-300 font-medium">Dashboard</span>
                </div>
                <Button variant="outline" onClick={() => navigate('/onboarding')} className="text-sm">
                    + Neuer Agent
                </Button>
            </header>

            <main className="container mx-auto p-6 md:p-12">
                <div className="mb-12">
                    <h1 className="text-3xl font-bold font-display mb-2">Meine AI Mitarbeiter</h1>
                    <p className="text-gray-400">Verwalten und überwachen Sie Ihre Voice Agents.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <RefreshCw className="animate-spin text-accent" size={32} />
                    </div>
                ) : agents.length === 0 ? (
                    <div className="text-center p-12 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-gray-400 mb-6">Noch keine Agents erstellt.</p>
                        <Button variant="primary" onClick={() => navigate('/onboarding')}>
                            Ersten Agent erstellen
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {agents.map(agent => (
                            <motion.div 
                                key={agent.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-surface rounded-2xl border border-white/10 overflow-hidden hover:border-accent/50 transition-colors group cursor-pointer"
                                onClick={() => navigate(`/agent/${agent.id}`)}
                            >
                                <div className="p-6 border-b border-white/5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center text-accent">
                                            <Phone size={24} />
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                                            agent.status === 'active' || agent.status === 'live' 
                                                ? 'bg-green-500/20 text-green-400' 
                                                : agent.status === 'pending_activation'
                                                ? 'bg-yellow-500/20 text-yellow-400'
                                                : agent.status === 'inactive'
                                                ? 'bg-gray-500/20 text-gray-400'
                                                : 'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                            {agent.status === 'live' && <CheckCircle size={12} />}
                                            {agent.status === 'pending_activation' && <Clock size={12} />}
                                            {agent.status === 'inactive' && <XCircle size={12} />}
                                            {agent.status === 'pending_activation' ? 'WARTEND' : agent.status === 'inactive' ? 'INAKTIV' : agent.status.toUpperCase()}
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold mb-1">{agent.businessProfile.companyName}</h3>
                                    <p className="text-sm text-gray-400">{agent.config.primaryLocale}</p>
                                    {agent.telephony?.phoneNumber && (
                                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-300">
                                            <Phone size={14} />
                                            <span>{agent.telephony.phoneNumber}</span>
                                            <span className={`px-1.5 py-0.5 rounded text-xs ${
                                                agent.telephony.status === 'active' 
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-gray-500/20 text-gray-400'
                                            }`}>
                                                {agent.telephony.status === 'active' ? 'Aktiv' : 'Zugewiesen'}
                                            </span>
                                        </div>
                                    )}
                                    {agent.subscription && (
                                        <div className="mt-1 text-xs text-gray-500">
                                            Plan: {agent.subscription.planName}
                                        </div>
                                    )}
                                    
                                    {agent.lastTestResult && (
                                        <div className="mt-3 bg-white/5 p-2 rounded text-xs">
                                            <div className="flex justify-between mb-1">
                                                <span>Diagnose Score:</span>
                                                <span className={agent.lastTestResult.score > 90 ? 'text-green-400' : 'text-yellow-400'}>
                                                    {agent.lastTestResult.score}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full ${agent.lastTestResult.score > 90 ? 'bg-green-500' : 'bg-yellow-500'} w-[var(--score)]`} 
                                                    style={{ '--score': `${agent.lastTestResult.score}%` } as React.CSSProperties}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 bg-black/20 flex flex-col gap-2">
                                    {(agent.status === 'inactive' || agent.status === 'pending_activation') && (
                                        <Button 
                                            variant="primary" 
                                            onClick={() => handleOpenActivationModal(agent.id)} 
                                            disabled={activatingAgentId === agent.id}
                                            className="w-full text-xs h-10 !bg-accent hover:!bg-accent/80 font-semibold"
                                        >
                                            {activatingAgentId === agent.id ? 'Aktiviere...' : 'Agent aktivieren'}
                                        </Button>
                                    )}
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => handleSyncAgent(agent.id)} className="flex-1 text-xs h-10">
                                            <RefreshCw size={14} className="mr-2" /> Sync
                                        </Button>
                                        <Button variant="outline" onClick={() => handleRunDiagnostics(agent.id)} className="flex-1 text-xs h-10">
                                            <Activity size={14} className="mr-2" /> Diagnose
                                        </Button>
                                        <Button variant="primary" onClick={() => handleTestAgent(agent.elevenLabsAgentId)} className="flex-1 text-xs h-10 !bg-white !text-black hover:!bg-gray-200 font-semibold">
                                            <Play size={14} className="mr-2" /> Testen
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Activation Modal */}
            {showActivationModal && activatingAgentId && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-surface rounded-2xl border border-white/10 p-6 max-w-md w-full"
                    >
                        <h2 className="text-2xl font-bold mb-4">Agent aktivieren</h2>
                        <p className="text-gray-400 mb-6">
                            Wählen Sie eine Telefonnummer für diesen Agenten aus oder aktivieren Sie ihn mit der bereits zugewiesenen Nummer.
                        </p>

                        {availableNumbers.length > 0 && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2">Verfügbare Telefonnummern:</label>
                                <div className="space-y-2">
                                    {availableNumbers.map((number) => (
                                        <button
                                            key={number.id}
                                            onClick={() => handleActivateAgent(activatingAgentId, number.id)}
                                            className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-left transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{number.number}</span>
                                                <span className="text-xs text-gray-400">{number.status}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowActivationModal(false);
                                    setAvailableNumbers([]);
                                }}
                                className="flex-1"
                            >
                                Abbrechen
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => handleActivateAgent(activatingAgentId)}
                                disabled={activatingAgentId === activatingAgentId}
                                className="flex-1"
                            >
                                Mit zugewiesener Nummer aktivieren
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};
