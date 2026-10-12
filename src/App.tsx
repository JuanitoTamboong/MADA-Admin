import { useCallback, useEffect, useRef, useState } from 'react';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import { supabase } from './supabase/supabase-client';
import './App.css';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const LAST_ACTIVITY_KEY = 'mada-admin-last-activity';
const ACTIVITY_STORAGE_INTERVAL_MS = 5 * 1000;

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

function readLastActivity(): number | null {
  const stored = localStorage.getItem(LAST_ACTIVITY_KEY);
  if (!stored) return null;

  const timestamp = Number(stored);
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null;
}

function App() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [authError, setAuthError] = useState<string | null>(null);
  const lastActivityRef = useRef(0);

  useEffect(() => {
    let isActive = true;
    let initialized = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isActive || !initialized) return;

      if (event === 'SIGNED_OUT' || !session) {
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        setAuthStatus('unauthenticated');
        return;
      }

      if (event === 'SIGNED_IN') {
        const now = Date.now();
        lastActivityRef.current = now;
        localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
      }

      setAuthStatus('authenticated');
    });

    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!isActive) return;

        if (!data.session) {
          localStorage.removeItem(LAST_ACTIVITY_KEY);
          initialized = true;
          setAuthStatus('unauthenticated');
          return;
        }

        const now = Date.now();
        const lastActivity = readLastActivity();
        if (lastActivity !== null && now - lastActivity >= IDLE_TIMEOUT_MS) {
          initialized = true;
          const { error: signOutError } = await supabase.auth.signOut();
          if (signOutError) {
            setAuthError(`Your session expired due to inactivity, but sign-out failed: ${signOutError.message}`);
          } else {
            localStorage.removeItem(LAST_ACTIVITY_KEY);
          }
          setAuthStatus('unauthenticated');
          return;
        }

        lastActivityRef.current = lastActivity ?? now;
        if (lastActivity === null) {
          localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
        }

        initialized = true;
        setAuthStatus('authenticated');
      } catch (error) {
        if (!isActive) return;
        initialized = true;
        setAuthStatus('unauthenticated');
        setAuthError(
          error instanceof Error
            ? `Unable to check your session: ${error.message}`
            : 'Unable to check your session.',
        );
      }
    };

    void initializeAuth();

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authStatus !== 'authenticated') return;

    let timer = 0;
    let lastStorageWrite = lastActivityRef.current;
    let isSigningOut = false;

    const scheduleSignOut = () => {
      window.clearTimeout(timer);
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = Math.max(IDLE_TIMEOUT_MS - elapsed, 0);
      timer = window.setTimeout(() => {
        void signOutIfIdle();
      }, remaining);
    };

    const signOutIfIdle = async () => {
      if (isSigningOut) return;

      const lastActivity = readLastActivity();
      if (lastActivity !== null) {
        lastActivityRef.current = Math.max(lastActivityRef.current, lastActivity);
      }

      if (Date.now() - lastActivityRef.current < IDLE_TIMEOUT_MS) {
        scheduleSignOut();
        return;
      }

      isSigningOut = true;
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        localStorage.removeItem(LAST_ACTIVITY_KEY);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
        setAuthError(`Your session expired due to inactivity, but sign-out failed: ${message}`);
        timer = window.setTimeout(() => {
          void signOutIfIdle();
        }, 60 * 1000);
      } finally {
        isSigningOut = false;
      }
    };

    const recordActivity = () => {
      const now = Date.now();
      lastActivityRef.current = now;
      setAuthError(null);
      if (now - lastStorageWrite >= ACTIVITY_STORAGE_INTERVAL_MS) {
        localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
        lastStorageWrite = now;
      }
      scheduleSignOut();
    };

    const syncActivity = (event: StorageEvent) => {
      if (event.key !== LAST_ACTIVITY_KEY) return;
      const lastActivity = readLastActivity();
      if (lastActivity !== null) {
        lastActivityRef.current = Math.max(lastActivityRef.current, lastActivity);
        scheduleSignOut();
      }
    };

    const checkActivityOnReturn = () => {
      if (document.visibilityState === 'visible') {
        void signOutIfIdle();
      }
    };

    const activityEvents = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'] as const;
    activityEvents.forEach((event) => window.addEventListener(event, recordActivity, { passive: true }));
    window.addEventListener('storage', syncActivity);
    document.addEventListener('visibilitychange', checkActivityOnReturn);
    scheduleSignOut();

    return () => {
      window.clearTimeout(timer);
      activityEvents.forEach((event) => window.removeEventListener(event, recordActivity));
      window.removeEventListener('storage', syncActivity);
      document.removeEventListener('visibilitychange', checkActivityOnReturn);
    };
  }, [authStatus]);

  const handleLogin = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    setAuthError(null);
    setAuthStatus('authenticated');
  }, []);

  return (
    <div className="App">
      {authError && (
        <p role="alert" style={{ color: '#b42318', padding: '1rem', textAlign: 'center' }}>
          {authError}
        </p>
      )}
      {authStatus === 'loading' ? null : authStatus === 'authenticated' ? (
        <AdminDashboard onLogout={() => setAuthStatus('unauthenticated')} />
      ) : (
        <AdminLogin onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
