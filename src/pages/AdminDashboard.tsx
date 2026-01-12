import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import {
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  CreditCard,
  ArrowUpRight,
  Search,
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SideNav } from '../components/dashboard/SideNav';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface DashboardStats {
  subscriptions: {
    active: number;
    byPlan: {
      starter: number;
      professional: number;
      enterprise: number;
    };
  };
  revenue: {
    mrr: number;
    currency: string;
  };
  users: {
    total: number;
    newThisMonth: number;
  };
}

interface RecentSubscription {
  id: string;
  plan_id: string;
  status: string;
  created_at: string;
  user?: {
    email: string;
    full_name: string | null;
  } | null;
}

const COLORS = ['#FF4D4D', '#FF8E3C', '#FFD700', '#00C49F', '#FFBB28', '#FF8042'];

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSubscriptions, setRecentSubscriptions] = useState<RecentSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, recentRes] = await Promise.all([
        apiClient.get<DashboardStats>('/admin/stats'),
        apiClient.get<{ subscriptions: RecentSubscription[] }>('/admin/recent-subscriptions'),
      ]);
      setStats(statsRes.data);
      setRecentSubscriptions(recentRes.data.subscriptions);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex font-sans text-white relative">
        <SideNav />
        <main className="flex-1 lg:ml-64 flex items-center justify-center">
          <LoadingSpinner size="lg" message="Lade Admin-Metriken..." />
        </main>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-background flex font-sans text-white relative">
        <SideNav />
        <main className="flex-1 lg:ml-64 flex items-center justify-center">
          <p>Keine Daten verfügbar oder Zugriff verweigert.</p>
        </main>
      </div>
    );
  }

  const conversionRate = ((stats.subscriptions.active / stats.users.total) * 100).toFixed(1);

  const planData = [
    { name: 'Starter', value: stats.subscriptions.byPlan.starter },
    { name: 'Professional', value: stats.subscriptions.byPlan.professional },
    { name: 'Enterprise', value: stats.subscriptions.byPlan.enterprise },
  ].filter((d) => d.value > 0);

  return (
    <div className="min-h-screen bg-background flex font-sans text-white relative">
      <div
        className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_90%)] -z-40 pointer-events-none"
        aria-hidden="true"
      />

      <SideNav />

      <main className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <header className="h-16 bg-background/80 backdrop-blur-lg border-b border-white/10 flex items-center justify-between px-8 sticky top-0 z-40 shadow-lg">
          <div className="flex items-center gap-3 text-gray-400">
            <span className="text-sm font-semibold text-white font-display">Admin</span>
            <span className="text-gray-600">/</span>
            <span className="text-sm text-gray-400">Dashboard Insights</span>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-bold font-display text-white tracking-tight">
                Business Overview
              </h1>
              <p className="text-gray-400 mt-1">
                Echtzeit-Metriken über Abonnements und Nutzerwachstum.
              </p>
            </div>
            <div className="hidden sm:block text-xs text-gray-500 bg-white/5 py-1 px-3 rounded-full border border-white/10">
              Letztes Update: {new Date().toLocaleTimeString()}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-white">
                <CardTitle className="text-sm font-medium">MRR</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.revenue.currency} {stats.revenue.mrr.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-emerald-400">
                  <TrendingUp className="h-3 w-3" />
                  <span>Stabil</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-white">
                <CardTitle className="text-sm font-medium">Active Subs</CardTitle>
                <CreditCard className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.subscriptions.active}</div>
                <p className="text-[10px] text-gray-500 mt-1">
                  {stats.subscriptions.byPlan.starter} Starter /{' '}
                  {stats.subscriptions.byPlan.professional} Pro
                </p>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-white">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users.total}</div>
                <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+{stats.users.newThisMonth} diesen Monat</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-white">
                <CardTitle className="text-sm font-medium">Conversion</CardTitle>
                <BarChart3 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conversionRate}%</div>
                <p className="text-[10px] text-gray-500 mt-1">User zu zahlenden Kunden</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle>Plan Verteilung</CardTitle>
                    <CardDescription>Visualisierung der Marktanteile</CardDescription>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={planData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {planData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                          }}
                          itemStyle={{ color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-white/5 backdrop-blur-md text-white">
                  <CardHeader>
                    <CardTitle>Wachstumsmetriken</CardTitle>
                    <CardDescription>Nutzer vs. Kunden</CardDescription>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Total Users', value: stats.users.total },
                          { name: 'Subscriptions', value: stats.subscriptions.active },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="value" fill="#FF4D4D" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Subscriptions</CardTitle>
                    <CardDescription>Die letzten 10 Transaktionen</CardDescription>
                  </div>
                  <Search className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-gray-400">
                          <th className="pb-3 px-2 font-medium">User</th>
                          <th className="pb-3 px-2 font-medium">Plan</th>
                          <th className="pb-3 px-2 font-medium">Status</th>
                          <th className="pb-3 px-2 font-medium">Datum</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.05]">
                        {recentSubscriptions.map((sub) => (
                          <tr key={sub.id} className="group hover:bg-white/[0.02]">
                            <td className="py-4 px-2">
                              <div className="font-medium text-white">
                                {sub.user?.full_name || 'Unbekannt'}
                              </div>
                              <div className="text-xs text-gray-500">{sub.user?.email || '-'}</div>
                            </td>
                            <td className="py-4 px-2 capitalize">{sub.plan_id.split('_')[0]}</td>
                            <td className="py-4 px-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  sub.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : 'bg-gray-500/10 text-gray-500'
                                }`}
                              >
                                {sub.status}
                              </span>
                            </td>
                            <td className="py-4 px-2 text-gray-400">
                              {new Date(sub.created_at).toLocaleDateString('de-CH')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8 h-fit">
              <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader>
                  <CardTitle>Plan Übersicht</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(
                      Object.entries(stats.subscriptions.byPlan) as [
                        keyof typeof stats.subscriptions.byPlan,
                        number,
                      ][]
                    ).map(([plan, count], idx) => {
                      const percentage =
                        stats.subscriptions.active > 0
                          ? (count / stats.subscriptions.active) * 100
                          : 0;
                      return (
                        <div key={plan} className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-400">
                            <span className="capitalize">{plan}</span>
                            <span>
                              {count} / {stats.subscriptions.active}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full transition-all duration-500"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: COLORS[idx % COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader>
                  <CardTitle>Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a
                    href="https://dashboard.stripe.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-sm group"
                  >
                    <span>Stripe Dashboard</span>
                    <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-primary" />
                  </a>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-sm group"
                  >
                    <span>Supabase Database</span>
                    <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-primary" />
                  </a>
                  <a
                    href="https://elevenlabs.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-sm group"
                  >
                    <span>ElevenLabs Usage</span>
                    <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-primary" />
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
