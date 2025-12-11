import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest, ApiRequestError } from '../services/api';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { useToast, ToastContainer, toast } from '../components/ui/Toast';
import { KPIOverview, DashboardStats } from '../components/dashboard/KPIOverview';
import { AgentCard, AgentCardData } from '../components/dashboard/AgentCard';
import { DashboardToolbar } from '../components/dashboard/DashboardToolbar';
import { RefreshCw, Inbox } from 'lucide-react';

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

type ViewMode = 'grid' | 'list';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { toasts, removeToast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasAttemptedDefaultProvision, setHasAttemptedDefaultProvision] = useState(false);
  const [isProvisioningDefault, setIsProvisioningDefault] = useState(false);
  
  // View and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{
    status?: string;
    industry?: string;
    language?: string;
  }>({});
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const getUserIdentity = () => {
    let userId = localStorage.getItem('aidevelo-user-id');
    if (!userId) {
      userId = `guest-${crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)}`;
      localStorage.setItem('aidevelo-user-id', userId);
    }

    const userEmail = localStorage.getItem('aidevelo-user-email') || undefined;

    return { userId, userEmail };
  };

  const ensureDefaultAgent = async () => {
    if (hasAttemptedDefaultProvision || isProvisioningDefault) {
      return null;
    }

    const { userId, userEmail } = getUserIdentity();
    setHasAttemptedDefaultProvision(true);
    setIsProvisioningDefault(true);

    try {
      const res = await apiRequest<{ success: boolean; data: Agent }>('/agents/default', {
        method: 'POST',
        body: JSON.stringify({ userId, userEmail }),
      });

      return res.data;
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.statusCode === 409) {
          // Agent already exists - this is fine
          return null;
        }
      }
      console.error('[Dashboard] Default agent provisioning failed:', error);
      setHasAttemptedDefaultProvision(false);
      return null;
    } finally {
      setIsProvisioningDefault(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    
    try {
      // Immer zuerst Default-Agent sicherstellen (nur beim ersten Load)
      if (!hasAttemptedDefaultProvision) {
        await ensureDefaultAgent();
      }

      // Dann Agents laden
      const res = await apiRequest<{ data: Agent[] }>('/agents');
      const agentData = res.data;

      setAgents(agentData);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        console.error('Failed to fetch agents:', error);
      }
    } finally {
      setLoading(false);
      if (showRefreshIndicator) setRefreshing(false);
    }
  };

  // Calculate dashboard stats
  const dashboardStats: DashboardStats = useMemo(() => {
    const activeAgents = agents.filter(a => a.status === 'active' || a.status === 'live').length;
    const totalAgents = agents.length;
    const callsToday = agents.reduce((sum, a) => sum + (a.metrics?.callsToday || 0), 0);
    const successRate = agents.length > 0
      ? Math.round(agents.reduce((sum, a) => sum + (a.metrics?.successRate || 0), 0) / agents.length)
      : 0;
    const missedCalls = 0; // Would need backend data

    return {
      activeAgents,
      totalAgents,
      callsToday,
      successRate,
      missedCalls,
    };
  }, [agents]);

  // Convert agents to card data format
  const agentCards: AgentCardData[] = useMemo(() => {
    return agents.map(agent => ({
      id: agent.id,
      name: agent.businessProfile.companyName,
      industry: agent.businessProfile.industry || 'Allgemein',
      status: agent.status === 'live' ? 'active' : agent.status,
      phoneNumber: agent.telephony?.phoneNumber,
      callsToday: agent.metrics?.callsToday,
      successRate: agent.metrics?.successRate,
      isDefaultAgent: (agent as any).metadata?.isDefaultAgent,
    }));
  }, [agents]);

  // Filter agents based on search and filters
  const filteredAgents = useMemo(() => {
    let filtered = [...agentCards];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(query) ||
        a.industry.toLowerCase().includes(query) ||
        a.phoneNumber?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(a => a.status === filters.status);
    }

    // Industry filter
    if (filters.industry) {
      filtered = filtered.filter(a => a.industry === filters.industry);
    }

    // Sort by: Default agents first, then by name
    filtered.sort((a, b) => {
      if (a.isDefaultAgent && !b.isDefaultAgent) return -1;
      if (!a.isDefaultAgent && b.isDefaultAgent) return 1;
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [agentCards, searchQuery, filters]);

  const handleTestAgent = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent?.elevenLabsAgentId) {
      console.warn('Agent has no ElevenLabs ID');
      return;
    }
    window.open(`https://elevenlabs.io/app/talk-to?agent_id=${agent.elevenLabsAgentId}`, '_blank');
  };

  const handleToggleStatus = async (agentId: string, newStatus: 'active' | 'inactive') => {
    try {
      const endpoint = newStatus === 'active' ? 'activate' : 'deactivate';
      const res = await apiRequest<{ success: boolean; data: Agent }>(`/agents/${agentId}/${endpoint}`, {
        method: 'PATCH',
      });
      
      setAgents(prev => prev.map(a => 
        a.id === agentId 
          ? { ...a, status: res.data.status } 
          : a
      ));
    } catch (error) {
      console.error(`Failed to ${newStatus === 'active' ? 'activate' : 'deactivate'} agent:`, error);
    }
  };

  const renderAgents = () => {
    if (loading || isProvisioningDefault) {
      return (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center p-12 bg-white/5 rounded-2xl border border-white/10"
        >
          <RefreshCw className="animate-spin text-accent mb-4" size={40} />
          <p className="text-gray-400">
            {isProvisioningDefault ? 'Ihr Agent wird vorbereitet...' : 'Lade Dashboard...'}
          </p>
        </motion.div>
      );
    }

    if (filteredAgents.length === 0) {

      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-12 bg-white/5 rounded-2xl border border-white/10"
        >
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
              <Inbox size={40} className="text-accent" />
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {searchQuery || Object.values(filters).some(Boolean) 
              ? 'Keine Agents gefunden' 
              : 'Noch keine Agents erstellt'}
          </h3>
          <p className="text-gray-400 mb-6">
            {searchQuery || Object.values(filters).some(Boolean)
              ? 'Versuchen Sie, Ihre Suchbegriffe oder Filter anzupassen.'
              : 'Erstellen Sie Ihren ersten Agent, um loszulegen.'}
          </p>
          {searchQuery || Object.values(filters).some(Boolean) ? (
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
                setFilters({});
              }}
            >
              Filter zurücksetzen
            </Button>
          ) : (
            <Button variant="primary" onClick={() => navigate('/onboarding')}>
              Ersten Agent erstellen
            </Button>
          )}
        </motion.div>
      );
    }

    return (
      <div className={viewMode === 'grid' 
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
        : 'space-y-4'
      }>
        {filteredAgents.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            viewMode={viewMode}
            onTest={handleTestAgent}
            onToggleStatus={handleToggleStatus}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-white">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <header className="p-6 border-b border-white/10 flex items-center justify-between bg-surface/50 backdrop-blur-md sticky top-0 z-50 relative">
        <div className="flex-1"></div>
        <div className="flex-1 flex justify-center">
          <Link to="/dashboard" className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded">
            <img 
              src="/logo-studio-white.png" 
              alt="AIDevelo Studio" 
              className="h-8 w-auto object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.parentElement?.querySelector('.logo-fallback-text');
                if (fallback) {
                  (fallback as HTMLElement).style.display = 'block';
                }
              }}
            />
            <span className="logo-fallback-text hidden font-display font-bold text-xl">
              AIDevelo Studio
            </span>
          </Link>
        </div>
        <div className="flex-1 flex justify-end">
          <Button 
            variant="outline" 
            onClick={() => fetchAgents(true)} 
            disabled={refreshing}
            className="text-sm flex items-center gap-2"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Aktualisieren
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6 md:p-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display mb-2">Dashboard</h1>
          <p className="text-gray-400">Verwalten und überwachen Sie Ihre Telefon-Agents</p>
        </div>

        {/* KPI Overview */}
        <KPIOverview stats={dashboardStats} loading={loading} />

        {/* Toolbar */}
        <DashboardToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          filters={filters}
          onFilterChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
          onCreateNew={() => navigate('/onboarding')}
        />

        {/* Agent List/Grid */}
        {renderAgents()}
      </main>
    </div>
  );
};
