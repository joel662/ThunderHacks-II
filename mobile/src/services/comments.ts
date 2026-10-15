import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  increment,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Comment } from '../types';
import { isDemoMode } from '../lib/demo';
import { MOCK_COMMENTS } from '../data/mockData';

export async function addComment(
  reportId: string,
  text: string,
  userId: string,
  userName: string
): Promise<string> {
  if (isDemoMode()) {
    const newComment: Comment = {
      id: `demo-${Date.now()}`,
      reportId,
      text,
      authorId: userId,
      authorName: userName,
      createdAt: new Date(),
    };
    if (!MOCK_COMMENTS[reportId]) MOCK_COMMENTS[reportId] = [];
    MOCK_COMMENTS[reportId].push(newComment);
    return newComment.id;
  }

  const commentsRef = collection(db, 'reports', reportId, 'comments');
  const docRef = await addDoc(commentsRef, {
    reportId,
    text,
    authorId: userId,
    authorName: userName,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, 'reports', reportId), {
    commentCount: increment(1),
  });

  return docRef.id;
}

export async function getComments(reportId: string): Promise<Comment[]> {
  if (isDemoMode()) {
    return MOCK_COMMENTS[reportId] || [];
  }
  const q = query(
    collection(db, 'reports', reportId, 'comments'),
    orderBy('createdAt', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Comment));
}

export function onCommentsChange(
  reportId: string,
  callback: (comments: Comment[]) => void
): Unsubscribe {
  if (isDemoMode()) {
    callback(MOCK_COMMENTS[reportId] || []);
    return () => {};
  }
  const q = query(
    collection(db, 'reports', reportId, 'comments'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Comment));
    callback(comments);
  });
}
