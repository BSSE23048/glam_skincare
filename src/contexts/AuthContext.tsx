import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { onIdTokenChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { Navigate, useLocation } from "react-router-dom";
import { firebase } from "../services/firebase";
import type { Profile } from "../domain/models";

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
  error: "",
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    admin: false,
    loading: Boolean(firebase),
    error: "",
  });

  useEffect(() => {
    if (!firebase) return;
    let sequence = 0;
    let profileUnsub: (() => void) | null = null;

    const unsubscribe = onIdTokenChanged(firebase.auth, async (user) => {
      const request = ++sequence;
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (!user) {
        if (request === sequence) {
          setState({
            user: null,
            profile: null,
            admin: false,
            loading: false,
            error: "",
          });
        }
        return;
      }

      try {
        // Read the current token. Forcing a refresh here re-enters onIdTokenChanged.
        const token = await user.getIdTokenResult();
        if (request !== sequence) return;
        const isAdmin = token?.claims.admin === true;
        setState({
          user,
          profile: null,
          admin: isAdmin,
          loading: false,
          error: "",
        });

        profileUnsub = onSnapshot(
          doc(firebase!.db, "users", user.uid),
          (docSnap) => {
            if (request === sequence) {
              const profile = docSnap.exists()
                ? (docSnap.data() as Profile)
                : null;
              setState({
                user,
                profile,
                admin: isAdmin,
                loading: false,
                error: "",
              });
            }
          },
          () => {
            if (request === sequence) {
              setState({
                user,
                profile: null,
                admin: isAdmin,
                loading: false,
                error: "",
              });
            }
          },
        );
      } catch {
        if (request === sequence) {
          setState({
            user: null,
            profile: null,
            admin: false,
            loading: false,
            error: "Could not restore your session. Please sign in again.",
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

export function RequireAuth({
  children,
  admin = false,
}: {
  children: ReactNode;
  admin?: boolean;
}) {
  const session = useAuth();
  const location = useLocation();

  if (session.loading) {
    return (
      <div
        style={{
          background: "#1A1917",
          color: "#FFFFFF",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h2
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "1.5rem",
              color: "#EFDCD7",
              marginBottom: "0.5rem",
            }}
          >
            Glam Skincare Executive Portal
          </h2>
          <p style={{ color: "#B8B0A6", fontSize: "0.9rem" }}>
            Restoring administrative session…
          </p>
        </div>
      </div>
    );
  }

  if (!firebase) {
    // Graceful fallback for unconfigured dev environment
    return (
      <div className="empty">
        <h1>Store connection unavailable.</h1>
        <p>Account services are not configured. Please contact the store.</p>
      </div>
    );
  }

  if (!session.user) {
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  if (admin && !session.admin) {
    return (
      <div
        style={{
          background: "#1A1917",
          color: "#FFFFFF",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          textAlign: "center",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "2rem",
            color: "#EFDCD7",
            marginBottom: "1rem",
          }}
        >
          Store Staff Access Required
        </h1>
        <p
          style={{
            color: "#B8B0A6",
            maxWidth: "450px",
            marginBottom: "1.75rem",
            lineHeight: 1.6,
            fontSize: "0.95rem",
          }}
        >
          Your account (<strong>{session.user.email}</strong>) does not have
          active administrator privileges. If you are store staff, please ensure
          custom admin claims are assigned.
        </p>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <a
            href="/"
            style={{
              background: "#EFDCD7",
              color: "#302E2A",
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: "0.9rem",
            }}
          >
            Return to Shop
          </a>
          <a
            href="/login"
            style={{
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#FFFFFF",
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "0.9rem",
            }}
          >
            Sign in with Another Account
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
