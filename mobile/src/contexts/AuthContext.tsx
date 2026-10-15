import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UserProfile } from '../types';
import { isDemoMode, setDemoMode } from '../lib/demo';

const DEMO_EMAIL = 'demo@311brampton.ca';
const DEMO_PASSWORD = 'demo123';

const DEMO_USER: UserProfile = {
  uid: 'demo-user-001',
  displayName: 'DemoResident_BRM',
  email: 'demo@311brampton.ca',
  createdAt: new Date('2024-06-01'),
  reportCount: 3,
  isAdmin: false,
};

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
        if (userDoc.exists()) {
          setUser({ uid: fbUser.uid, ...userDoc.data() } as UserProfile);
        }
      } else if (!isDemoMode()) {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      setDemoMode(true);
      setUser(DEMO_USER);
      setLoading(false);
      return;
    }
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    if (email === DEMO_EMAIL) {
      setDemoMode(true);
      setUser({ ...DEMO_USER, displayName });
      setLoading(false);
      return;
    }
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const profile: Omit<UserProfile, 'uid'> = {
      displayName,
      email,
      createdAt: serverTimestamp(),
      reportCount: 0,
      isAdmin: false,
    };
    await setDoc(doc(db, 'users', cred.user.uid), profile);
    setUser({ uid: cred.user.uid, ...profile });
  };

  const signOut = async () => {
    if (isDemoMode()) {
      setDemoMode(false);
      setUser(null);
      return;
    }
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
