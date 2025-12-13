import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register, loginWithMagicLink, isLoading } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isMagicLink, setIsMagicLink] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isMagicLink) {
        await loginWithMagicLink(email);
        setMagicLinkSent(true);
      } else if (isRegistering) {
        if (!password || password.length < 6) {
          setError('Passwort muss mindestens 6 Zeichen lang sein');
          setIsSubmitting(false);
          return;
        }
        await register(email, password);
        navigate('/dashboard', { replace: true });
      } else {
        if (!password) {
          setError('Passwort ist erforderlich');
          setIsSubmitting(false);
          return;
        }
        await login(email, password);
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Anmeldung fehlgeschlagen');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Magic Link gesendet</h1>
          <p className="text-gray-400 mb-6">
            Wir haben dir einen Magic Link an <strong>{email}</strong> gesendet.
            Bitte prüfe dein E-Mail-Postfach und klicke auf den Link.
          </p>
          <button
            onClick={() => {
              setMagicLinkSent(false);
              setEmail('');
            }}
            className="px-4 py-2 bg-accent text-black rounded hover:bg-accent/80"
          >
            Zurück
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-gray-800 rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2 text-center">
          {isRegistering ? 'Registrieren' : 'Anmelden'}
        </h1>
        <p className="text-gray-400 text-center mb-6">
          {isRegistering
            ? 'Erstelle ein neues Konto'
            : isMagicLink
            ? 'Wir senden dir einen Magic Link per E-Mail'
            : 'Melde dich mit deinem Konto an'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="deine@email.com"
            />
          </div>

          {!isMagicLink && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Passwort
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!isMagicLink}
                minLength={isRegistering ? 6 : undefined}
                autoComplete={isRegistering ? "new-password" : "current-password"}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder={isRegistering ? 'Mindestens 6 Zeichen' : 'Dein Passwort'}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full px-4 py-2 bg-accent text-black rounded font-semibold hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner />
                {isMagicLink ? 'Sende...' : isRegistering ? 'Registriere...' : 'Anmelden...'}
              </span>
            ) : isMagicLink ? (
              'Magic Link senden'
            ) : isRegistering ? (
              'Registrieren'
            ) : (
              'Anmelden'
            )}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center">
          {!isMagicLink && (
            <button
              onClick={() => {
                setIsMagicLink(true);
                setError(null);
              }}
              className="text-sm text-accent hover:text-accent/80"
            >
              Mit Magic Link anmelden
            </button>
          )}

          {isMagicLink && (
            <button
              onClick={() => {
                setIsMagicLink(false);
                setError(null);
              }}
              className="text-sm text-gray-400 hover:text-white"
            >
              Zurück zu Passwort-Anmeldung
            </button>
          )}

          <div className="text-sm text-gray-400">
            {isRegistering ? (
              <>
                Bereits ein Konto?{' '}
                <button
                  onClick={() => {
                    setIsRegistering(false);
                    setError(null);
                  }}
                  className="text-accent hover:text-accent/80"
                >
                  Anmelden
                </button>
              </>
            ) : (
              <>
                Noch kein Konto?{' '}
                <button
                  onClick={() => {
                    setIsRegistering(true);
                    setError(null);
                  }}
                  className="text-accent hover:text-accent/80"
                >
                  Registrieren
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


