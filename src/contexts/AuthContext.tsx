import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { onIdTokenChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { Navigate, useLocation } from 'react-router-dom';
import { firebase } from '../services/firebase';
import type { Profile } from '../domain/models';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  admin: boolean;
  loading: boolean;
  error: string;
}

const Context = createContext<AuthState>({
  user: null,
  profile: null,
  admin: false,
  loading: false,
  error: '',
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    admin: false,
    loading: Boolean(firebase),
    error: '',
  });

  useEffect(() => {
    if (!firebase) return;
    let sequence = 0;
    let profileUnsub: (() => void) | null = null;

    const unsubscribe = onIdTokenChanged(firebase.auth, async user => {
      const request = ++sequence;
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (!user) {
        if (request === sequence) {
          setState({ user: null, profile: null, admin: false, loading: false, error: '' });
        }
        return;
      }

      try {
        const token = await user.getIdTokenResult();
        const isAdmin = token?.claims.admin === true;

        profileUnsub = onSnapshot(
          doc(firebase!.db, 'users', user.uid),
          docSnap => {
            if (request === sequence) {
              const profile = docSnap.exists() ? (docSnap.data() as Profile) : null;
              setState({ user, profile, admin: isAdmin, loading: false, error: '' });
            }
          },
          () => {
            if (request === sequence) {
              setState({ user, profile: null, admin: isAdmin, loading: false, error: '' });
            }
          }
        );
      } catch {
        if (request === sequence) {
          setState({
            user: null,
            profile: null,
            admin: false,
            loading: false,
            error: 'Could not restore your session. Please sign in again.',
          });
        }
      }
    });

    return () => {
      sequence++;
      if (profileUnsub) profileUnsub();
      unsubscribe();
    };
  }, []);

  return <Context.Provider value={state}>{children}</Context.Provider>;
}

export const useAuth = () => useContext(Context);

export function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const session = useAuth();
  const location = useLocation();

  if (session.loading) {
    return <div className="empty container page-space" role="status">Restoring your session…</div>;
  }

  if (!firebase) {
    // Graceful fallback for unconfigured dev environment
    return <>{children}</>;
  }

  if (!session.user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (admin && !session.admin) {
    return (
      <div className="empty container page-space">
        <h1>This space is for store staff.</h1>
        <p>Your account does not have administrator access.</p>
      </div>
    );
  }

  return <>{children}</>;
}

