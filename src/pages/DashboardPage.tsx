import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest, ApiRequestError } from '../services/api';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Activity, Phone, Settings, Play, RefreshCw, BarChart } from 'lucide-react';

interface Agent {
    id: string;
    elevenLabsAgentId?: string;
    businessProfile: {
        companyName: string;
    };
    config: {
        primaryLocale: string;
    };
    status: string;
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
                                className="bg-surface rounded-2xl border border-white/10 overflow-hidden hover:border-accent/50 transition-colors group"
                            >
                                <div className="p-6 border-b border-white/5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center text-accent">
                                            <Phone size={24} />
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-xs font-bold ${agent.status === 'live' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                            {agent.status.toUpperCase()}
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold mb-1">{agent.businessProfile.companyName}</h3>
                                    <p className="text-sm text-gray-400">{agent.config.primaryLocale}</p>
                                    
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
                                <div className="p-4 bg-black/20 flex gap-2">
                                    <Button variant="outline" onClick={() => handleRunDiagnostics(agent.id)} className="flex-1 text-xs h-10">
                                        <Activity size={14} className="mr-2" /> Diagnose
                                    </Button>
                                    <Button variant="primary" onClick={() => handleTestAgent(agent.elevenLabsAgentId)} className="flex-1 text-xs h-10 bg-white text-black hover:bg-gray-200">
                                        <Play size={14} className="mr-2" /> Testen
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};
