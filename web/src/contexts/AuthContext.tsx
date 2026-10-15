import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthChange, getUserProfile, logoutAdmin, loginAdmin } from '@/services/auth';
import { isDemoMode, setDemoMode, DEMO_EMAIL, DEMO_PASSWORD } from '@/lib/demo';
import { DEMO_USER } from '@/data/mockData';
import type { UserProfile } from '@/types';

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode()) {
      setUser(DEMO_USER);
      setLoading(false);
      return;
    }

    const ADMIN_EMAILS = ['admin@311brampton.ca'];
    const unsub = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        let profile: UserProfile | null = null;
        try {
          profile = await getUserProfile(firebaseUser.uid);
        } catch {}
        const isAdmin = profile?.isAdmin || ADMIN_EMAILS.includes(firebaseUser.email || '');
        if (isAdmin) {
          setUser(profile || {
            uid: firebaseUser.uid,
            displayName: firebaseUser.email?.split('@')[0] || 'Admin',
            email: firebaseUser.email || '',
            isAdmin: true,
            reportCount: 0,
            createdAt: new Date(),
          });
        } else {
          await logoutAdmin();
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      setDemoMode(true);
      setUser(DEMO_USER);
      return;
    }
    await loginAdmin(email, password);
  };

  const logout = async () => {
    if (isDemoMode()) {
      setDemoMode(false);
      setUser(null);
      return;
    }
    await logoutAdmin();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
