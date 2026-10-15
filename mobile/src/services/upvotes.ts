import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { isDemoMode } from '../lib/demo';

const demoUpvotes = new Set<string>();

export async function hasUpvoted(reportId: string, userId: string): Promise<boolean> {
  if (isDemoMode()) {
    return demoUpvotes.has(`${reportId}:${userId}`);
  }
  const ref = doc(db, 'reports', reportId, 'upvotes', userId);
  const snap = await getDoc(ref);
  return snap.exists();
}

export async function toggleUpvote(
  reportId: string,
  userId: string
): Promise<boolean> {
  if (isDemoMode()) {
    const key = `${reportId}:${userId}`;
    if (demoUpvotes.has(key)) {
      demoUpvotes.delete(key);
      return false;
    } else {
      demoUpvotes.add(key);
      return true;
    }
  }

  const upvoteRef = doc(db, 'reports', reportId, 'upvotes', userId);
  const reportRef = doc(db, 'reports', reportId);
  const snap = await getDoc(upvoteRef);

  if (snap.exists()) {
    await deleteDoc(upvoteRef);
    await updateDoc(reportRef, { upvoteCount: increment(-1) });
    return false;
  } else {
    await setDoc(upvoteRef, {
      userId,
      reportId,
      createdAt: serverTimestamp(),
    });
    await updateDoc(reportRef, { upvoteCount: increment(1) });
    return true;
  }
}
