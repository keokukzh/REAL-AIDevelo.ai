import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SideNav } from '../components/dashboard/SideNav';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { apiClient } from '../services/apiClient';
import { toast } from '../components/ui/Toast';
import { CreditCard, Calendar, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { ROUTES } from '../config/navigation';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface SubscriptionData {
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export const SubscriptionDashboard: React.FC = () => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await apiClient.get<{ subscription: SubscriptionData | null }>(
        '/subscription/current',
      );
      setSubscription(response.data.subscription);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      toast.error('Fehler beim Laden des Abonnements');
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await apiClient.post<{ url: string }>('/subscription/create-portal-session');
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Failed to create portal session:', error);
      toast.error('Portal konnte nicht geöffnet werden');
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Möchten Sie Ihr Abonnement wirklich zum Ende der Laufzeit kündigen?')) return;

    try {
      await apiClient.post('/subscription/cancel');
      toast.success('Abonnement erfolgreich zum Periodenende gekündigt');
      fetchSubscription();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast.error('Fehler beim Kündigen');
    }
  };

  const handleReactivate = async () => {
    try {
      await apiClient.post('/subscription/reactivate');
      toast.success('Abonnement erfolgreich reaktiviert');
      fetchSubscription();
    } catch (error) {
      console.error('Failed to reactivate:', error);
      toast.error('Fehler beim Reaktivieren');
    }
  };

  const getPlanName = (priceId: string) => {
    if (priceId.includes('starter') || priceId.toLowerCase().includes('starter')) return 'Starter';
    if (priceId.includes('pro') || priceId.toLowerCase().includes('pro')) return 'Professional';
    if (priceId.includes('enterprise') || priceId.toLowerCase().includes('enterprise'))
      return 'Enterprise';
    return 'Premium';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex font-sans text-white relative">
        <SideNav />
        <main className="flex-1 lg:ml-64 flex items-center justify-center">
          <LoadingSpinner size="lg" message="Lade Abonnement-Daten..." />
        </main>
      </div>
    );
  }

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
            <span className="text-sm font-semibold text-white font-display">Dashboard</span>
            <span className="text-gray-600">/</span>
            <span className="text-sm text-gray-400">Abonnement</span>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
          <h1 className="text-3xl font-bold font-display text-white tracking-tight mb-8">
            Abonnement Verwaltung
          </h1>

          {!subscription ? (
            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                  <CreditCard className="text-gray-400" />
                </div>
                <CardTitle className="text-2xl">Kein aktives Abonnement</CardTitle>
                <CardDescription className="text-gray-400">
                  Wählen Sie einen Plan aus, um die volle Power Ihrer KI Voice Agents zu nutzen.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>24/7 Erreichbarkeit für Ihre Kunden</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Automatische Terminbuchung im Kalender</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Echtzeit-Gespräche mit KI-Agenten</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-6">
                <Button
                  onClick={() => navigate(ROUTES.PRICING)}
                  className="w-full sm:w-auto flex items-center gap-2"
                >
                  Pläne ansehen <ArrowRight className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="grid gap-8">
              <Card
                className={`border-white/10 bg-white/5 backdrop-blur-md overflow-hidden ${subscription.cancel_at_period_end ? 'ring-1 ring-amber-500/30' : ''}`}
              >
                <div
                  className={`h-1.5 w-full ${subscription.cancel_at_period_end ? 'bg-amber-500' : 'bg-primary'}`}
                />
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/30">
                          Aktuell
                        </span>
                        {subscription.status === 'active' && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/30">
                            Aktiv
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-3xl font-bold">
                        {getPlanName(subscription.plan_id)}
                      </CardTitle>
                      <CardDescription className="text-gray-400 mt-1">
                        Ihre gewählte Lösung für KI-Automation
                      </CardDescription>
                    </div>
                    <CreditCard className="w-10 h-10 text-white/20" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Abrechnungszeitraum
                      </p>
                      <div className="flex items-center gap-2 text-white">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">
                          {new Date(subscription.current_period_start).toLocaleDateString('de-CH')}{' '}
                          - {new Date(subscription.current_period_end).toLocaleDateString('de-CH')}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Erneuerung am
                      </p>
                      <p className="font-medium text-white text-lg">
                        {new Date(subscription.current_period_end).toLocaleDateString('de-CH')}
                      </p>
                    </div>
                  </div>

                  {subscription.cancel_at_period_end && (
                    <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-start gap-4">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-500">Kündigung vorgemerkt</p>
                        <p className="text-sm text-gray-300 mt-1">
                          Ihr Abonnement läuft am{' '}
                          {new Date(subscription.current_period_end).toLocaleDateString('de-CH')}{' '}
                          aus. Bis dahin können Sie alle Funktionen weiterhin uneingeschränkt
                          nutzen.
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleReactivate}
                          className="mt-3 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 p-0 h-auto font-bold"
                        >
                          Kündigung zurückziehen
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-white/[0.02] border-t border-white/10 p-6 flex flex-col sm:flex-row gap-4">
                  <Button onClick={handleManageBilling} className="w-full sm:w-auto">
                    Zahlungsmethode & Rechnungen
                  </Button>

                  {!subscription.cancel_at_period_end && (
                    <Button
                      variant="ghost"
                      className="w-full sm:w-auto text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                      onClick={handleCancelSubscription}
                    >
                      Plan kündigen
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="w-full sm:w-auto ml-auto"
                    onClick={() => navigate(ROUTES.PRICING)}
                  >
                    Plan ändern
                  </Button>
                </CardFooter>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl border border-white/5 bg-white/5">
                  <h3 className="text-lg font-bold mb-4">Support & Hilfe</h3>
                  <p className="text-sm text-gray-400 mb-6">
                    Haben Sie Fragen zu Ihrer Rechnung oder benötigen Sie Hilfe beim Upgrade?
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(ROUTES.DASHBOARD)}
                  >
                    Support kontaktieren
                  </Button>
                </div>
                <div className="p-6 rounded-2xl border border-white/5 bg-white/5">
                  <h3 className="text-lg font-bold mb-4">Upgrade Vorteile</h3>
                  <ul className="space-y-3 text-sm text-gray-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" /> Mehr gleichzeitige Anrufe
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" /> Premium ElevenLabs Stimmen
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" /> API Zugang für
                      Automatisierungen
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
