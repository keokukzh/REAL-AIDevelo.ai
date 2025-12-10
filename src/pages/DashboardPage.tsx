import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest, ApiRequestError } from '../services/api';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { AgentCard } from '../components/AgentCard';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { ToastContainer } from '../components/ui/Toast';
import { AgentInlineEditor } from '../components/agent/AgentInlineEditor';
import { 
  Activity, 
  Phone, 
  Settings, 
  Play, 
  RefreshCw, 
  BarChart, 
  CheckCircle, 
  Clock, 
  XCircle,
  Search,
  Filter,
  Grid3x3,
  List,
  X,
  TrendingUp,
  Users,
  PhoneCall
} from 'lucide-react';

interface Agent {
  id: string;
  elevenLabsAgentId?: string;
  businessProfile: {
    companyName: string;
    industry?: string;
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
  metrics?: {
    callsToday?: number;
    successRate?: number;
    avgDuration?: number;
  };
}

type ViewMode = 'grid' | 'list' | 'compact';
type SortOption = 'name' | 'status' | 'created' | 'calls';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { toasts, removeToast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingAgentId, setActivatingAgentId] = useState<string | null>(null);
  const [syncingAgentId, setSyncingAgentId] = useState<string | null>(null);
  const [availableNumbers, setAvailableNumbers] = useState<Array<{ id: string; number: string; status: string }>>([]);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  
  // New state for filters and view
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [languageFilter, setLanguageFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await apiRequest<{ data: Agent[] }>('/agents');
      setAgents(res.data);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        // Could show toast here
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const total = agents.length;
    const active = agents.filter(a => a.status === 'active' || a.status === 'live').length;
    const callsToday = agents.reduce((sum, a) => sum + (a.metrics?.callsToday || 0), 0);
    const avgSuccessRate = agents.length > 0
      ? agents.reduce((sum, a) => sum + (a.metrics?.successRate || 0), 0) / agents.length
      : 0;

    return { total, active, callsToday, avgSuccessRate };
  }, [agents]);

  // Filter and sort agents
  const filteredAndSortedAgents = useMemo(() => {
    let filtered = [...agents];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.businessProfile.companyName.toLowerCase().includes(query) ||
        a.businessProfile.industry?.toLowerCase().includes(query) ||
        a.config.primaryLocale.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(a => a.status === statusFilter);
    }

    // Language filter
    if (languageFilter) {
      filtered = filtered.filter(a => a.config.primaryLocale === languageFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.businessProfile.companyName.localeCompare(b.businessProfile.companyName);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'created':
          // Would need createdAt in Agent interface
          return 0;
        case 'calls':
          const aCalls = a.metrics?.callsToday || 0;
          const bCalls = b.metrics?.callsToday || 0;
          return bCalls - aCalls;
        default:
          return 0;
      }
    });

    return filtered;
  }, [agents, searchQuery, statusFilter, languageFilter, sortBy]);

  const handleRunDiagnostics = async (agentId: string) => {
    try {
      const res = await apiRequest<{ data: { score: number; passed: boolean; timestamp: string } }>(`/tests/${agentId}/run`, { method: 'POST' });
      setAgents(prev => prev.map(a => 
        a.id === agentId 
          ? { ...a, lastTestResult: res.data } 
          : a
      ));
      // Use toast instead of alert
    } catch (error) {
      const errorMessage = error instanceof ApiRequestError 
        ? error.message 
        : "Diagnose konnte nicht gestartet werden.";
      // Use toast
    }
  };

  const handleTestAgent = (agentId?: string) => {
    if (!agentId) {
      // Use toast
      return;
    }
    window.open(`https://elevenlabs.io/app/talk-to?agent_id=${agentId}`, '_blank');
  };

  const handleActivateAgent = async (agentId: string, phoneNumberId?: string) => {
    setActivatingAgentId(agentId);
    try {
      const res = await apiRequest<{ success: boolean; data: Agent; message?: string }>(`/agents/${agentId}/activate`, {
        method: 'PATCH',
        body: phoneNumberId ? JSON.stringify({ phoneNumberId }) : undefined,
      });
      
      setAgents(prev => prev.map(a => 
        a.id === agentId 
          ? { ...a, status: res.data.status, telephony: res.data.telephony } 
          : a
      ));
      
      setShowActivationModal(false);
      setAvailableNumbers([]);
      // Use toast
    } catch (error) {
      const errorMessage = error instanceof ApiRequestError 
        ? error.message 
        : "Fehler beim Aktivieren des Agents.";
      // Use toast
    } finally {
      setActivatingAgentId(null);
    }
  };

  const handleOpenActivationModal = async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    setShowActivationModal(true);
    setActivatingAgentId(agentId);

    try {
      const planId = agent.subscription?.planId || 'starter';
      const res = await apiRequest<{ success: boolean; data: Array<{ id: string; number: string; status: string }> }>(
        `/telephony/numbers?planId=${planId}`
      );
      setAvailableNumbers(res.data);
    } catch (error) {
      console.error('Failed to fetch phone numbers:', error);
    }
  };

  const handleSyncAgent = async (agentId: string) => {
    setSyncingAgentId(agentId);
    try {
      await apiRequest(`/sync/agents/${agentId}`, { method: 'POST' });
      fetchAgents();
      // Use toast
    } catch (error) {
      const errorMessage = error instanceof ApiRequestError 
        ? error.message 
        : "Fehler beim Synchronisieren des Agents.";
      // Use toast
    } finally {
      setSyncingAgentId(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter(null);
    setLanguageFilter(null);
  };

  const hasActiveFilters = searchQuery.trim() || statusFilter || languageFilter;

  return (
    <div className="min-h-screen bg-background text-white">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <header className="p-6 border-b border-white/10 flex items-center justify-between bg-surface/50 backdrop-blur-md sticky top-0 z-50 relative">
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
        <div className="flex-1 flex justify-end">
          <Button variant="outline" onClick={() => navigate('/onboarding')} className="text-sm">
            + Neuer Agent
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6 md:p-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display mb-2">Meine AI Mitarbeiter</h1>
          <p className="text-gray-400">Verwalten und überwachen Sie Ihre Voice Agents.</p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface rounded-xl border border-white/10 p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Agents</span>
              <Users size={20} className="text-accent" />
            </div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface rounded-xl border border-white/10 p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Aktive</span>
              <CheckCircle size={20} className="text-green-400" />
            </div>
            <div className="text-3xl font-bold">{stats.active}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface rounded-xl border border-white/10 p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Anrufe heute</span>
              <PhoneCall size={20} className="text-blue-400" />
            </div>
            <div className="text-3xl font-bold">{stats.callsToday}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface rounded-xl border border-white/10 p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Ø Erfolgsrate</span>
              <TrendingUp size={20} className="text-yellow-400" />
            </div>
            <div className="text-3xl font-bold">{Math.round(stats.avgSuccessRate)}%</div>
          </motion.div>
        </div>

        {/* Filters & Search */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Agents durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:border-accent focus:outline-none"
              />
            </div>
            <Button
              variant={showFilters ? 'primary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter size={18} />
              Filter
              {hasActiveFilters && (
                <span className="bg-accent text-black rounded-full px-2 py-0.5 text-xs font-bold">
                  {[statusFilter, languageFilter].filter(Boolean).length}
                </span>
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
                <X size={18} />
                Zurücksetzen
              </Button>
            )}
            <div className="flex gap-2 border border-white/10 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'outline'}
                onClick={() => setViewMode('grid')}
                className="p-2"
              >
                <Grid3x3 size={18} />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                onClick={() => setViewMode('list')}
                className="p-2"
              >
                <List size={18} />
              </Button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-surface border border-white/10 rounded-lg p-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={statusFilter || ''}
                    onChange={(e) => setStatusFilter(e.target.value || null)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-accent focus:outline-none"
                  >
                    <option value="">Alle Status</option>
                    <option value="active">Aktiv</option>
                    <option value="live">Live</option>
                    <option value="inactive">Inaktiv</option>
                    <option value="pending_activation">Wartend</option>
                    <option value="draft">Entwurf</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Sprache</label>
                  <select
                    value={languageFilter || ''}
                    onChange={(e) => setLanguageFilter(e.target.value || null)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-accent focus:outline-none"
                  >
                    <option value="">Alle Sprachen</option>
                    <option value="de-CH">Deutsch (CH)</option>
                    <option value="fr-CH">Français (CH)</option>
                    <option value="it-CH">Italiano (CH)</option>
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Sortieren nach</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-accent focus:outline-none"
                  >
                    <option value="name">Name</option>
                    <option value="status">Status</option>
                    <option value="calls">Anrufe</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Agent List/Grid */}
        {loading ? (
          <div className="flex justify-center p-12">
            <RefreshCw className="animate-spin text-accent" size={32} />
          </div>
        ) : filteredAndSortedAgents.length === 0 ? (
          <div className="text-center p-12 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-gray-400 mb-6">
              {hasActiveFilters ? 'Keine Agents gefunden, die den Filtern entsprechen.' : 'Noch keine Agents erstellt.'}
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Filter zurücksetzen
              </Button>
            ) : (
              <Button variant="primary" onClick={() => navigate('/onboarding')}>
                Ersten Agent erstellen
              </Button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }>
            {filteredAndSortedAgents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onEdit={(agent) => setEditingAgent(agent)}
                onTest={handleTestAgent}
                onSync={handleSyncAgent}
                onDiagnostics={handleRunDiagnostics}
                onActivate={handleOpenActivationModal}
                onClick={(agent) => navigate(`/agent/${agent.id}`)}
                activating={activatingAgentId === agent.id}
                syncing={syncingAgentId === agent.id}
              />
            ))}
          </div>
        )}
      </main>

      {/* Activation Modal */}
      <Modal
        isOpen={showActivationModal}
        onClose={() => {
          setShowActivationModal(false);
          setAvailableNumbers([]);
        }}
        title="Agent aktivieren"
      >
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
                  onClick={() => handleActivateAgent(activatingAgentId!, number.id)}
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
            onClick={() => handleActivateAgent(activatingAgentId!)}
            disabled={!activatingAgentId}
            className="flex-1"
          >
            Mit zugewiesener Nummer aktivieren
          </Button>
        </div>
      </Modal>

      {/* Inline Editor Drawer */}
      {editingAgent && (
        <AgentInlineEditor
          agent={editingAgent as any}
          isOpen={!!editingAgent}
          onClose={() => setEditingAgent(null)}
          onSave={(updatedAgent) => {
            setAgents((prev) =>
              prev.map((a) => (a.id === updatedAgent.id ? { ...a, ...updatedAgent } : a))
            );
            setEditingAgent(null);
          }}
        />
      )}
    </div>
  );
};
