import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { apiRequest, ApiRequestError } from '../services/api';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ['payment-session', sessionId],
    enabled: !!sessionId,
    queryFn: async () =>
      apiRequest<{
        success: boolean;
        data: {
          sessionId: string;
          status: string;
          planId: string;
          planName: string;
          purchaseId: string;
        };
      }>(`/payments/session/${sessionId}`),
  });

  useEffect(() => {
    if (!sessionId) {
      setError('Keine Session-ID gefunden');
      setLoading(false);
      return;
    }

    if (isLoading) {
      setLoading(true);
      return;
    }

    if (queryError) {
      const errorMessage = queryError instanceof ApiRequestError
        ? queryError.message
        : 'Fehler beim Laden der Session-Daten';
      setError(errorMessage);
      setLoading(false);
      return;
    }

    if (data) {
      if (data.data.status === 'paid') {
        setPurchaseId(data.data.purchaseId);
        setLoading(false);
        setTimeout(() => {
          navigate(`/onboarding?purchaseId=${data.data.purchaseId}`);
        }, 2000);
      } else {
        setError('Zahlung noch nicht abgeschlossen');
        setLoading(false);
      }
    }
  }, [data, queryError, isLoading, navigate, sessionId]);

  const handleContinue = () => {
    if (purchaseId) {
      navigate(`/onboarding?purchaseId=${purchaseId}`);
    } else {
      navigate('/onboarding');
    }
  };

  return (
    <div className="min-h-screen bg-background text-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-surface/50 rounded-2xl p-8 border border-white/10 text-center"
      >
        {loading ? (
          <>
            <Loader2 className="w-16 h-16 text-accent animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Zahlung wird verarbeitet...</h2>
            <p className="text-gray-400">Bitte warten Sie einen Moment.</p>
          </>
        ) : error ? (
          <>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Fehler</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <Button variant="primary" onClick={() => navigate('/')}>
              Zur Startseite
            </Button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Zahlung erfolgreich!</h2>
            <p className="text-gray-400 mb-6">
              Vielen Dank für Ihren Kauf. Sie werden jetzt zum Onboarding weitergeleitet...
            </p>
            <Button variant="primary" onClick={handleContinue} className="w-full">
              Zum Onboarding
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
};


