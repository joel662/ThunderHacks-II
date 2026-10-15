import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import type { UserProfile } from '@/types';

const ADMIN_EMAILS = ['admin@311brampton.ca'];

export async function loginAdmin(email: string, password: string): Promise<UserProfile> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  let profile: UserProfile | null = null;
  try {
    profile = await getUserProfile(cred.user.uid);
  } catch {}
  const isAdmin = profile?.isAdmin || ADMIN_EMAILS.includes(email.toLowerCase());
  if (!isAdmin) {
    await signOut(auth);
    throw new Error('Access denied. Admin privileges required.');
  }
  return profile || {
    uid: cred.user.uid,
    displayName: email.split('@')[0],
    email,
    isAdmin: true,
    reportCount: 0,
    createdAt: new Date(),
  };
}

export async function logoutAdmin(): Promise<void> {
  await signOut(auth);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as UserProfile;
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
