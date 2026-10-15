import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  increment,
  query,
  orderBy,
  onSnapshot,
  type Unsubscribe,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/config/firebase';
import type { Report, Comment, ReportStatus } from '@/types';

export async function getAllReports(): Promise<Report[]> {
  const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Report));
}

export function subscribeToReports(callback: (reports: Report[]) => void): Unsubscribe {
  const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const reports = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Report));
    callback(reports);
  });
}

export async function getReport(id: string): Promise<Report | null> {
  const snap = await getDoc(doc(db, 'reports', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Report;
}

export async function updateReportStatus(id: string, status: Report['status']): Promise<void> {
  await updateDoc(doc(db, 'reports', id), {
    status,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteReport(id: string): Promise<void> {
  await deleteDoc(doc(db, 'reports', id));
}

export async function getReportComments(reportId: string): Promise<Comment[]> {
  const q = query(
    collection(db, 'reports', reportId, 'comments'),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment));
}

export function subscribeToComments(
  reportId: string,
  callback: (comments: Comment[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'reports', reportId, 'comments'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snap) => {
    const comments = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment));
    callback(comments);
  });
}

export async function uploadStatusImage(reportId: string, file: File): Promise<string> {
  const path = `reports/${reportId}/status_comments/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function addStatusComment(
  reportId: string,
  text: string,
  authorId: string,
  authorName: string,
  statusFrom: ReportStatus,
  statusTo: ReportStatus,
  imageUrl?: string,
): Promise<void> {
  const commentData: Record<string, any> = {
    reportId,
    text,
    authorId,
    authorName,
    createdAt: Timestamp.now(),
    type: 'status_update',
    statusChange: { from: statusFrom, to: statusTo },
  };
  if (imageUrl) commentData.imageUrl = imageUrl;

  await addDoc(collection(db, 'reports', reportId, 'comments'), commentData);
  await updateDoc(doc(db, 'reports', reportId), {
    commentCount: increment(1),
  });
}

export function getReportStats(reports: Report[]) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const total = reports.length;
  const open = reports.filter((r) => r.status === 'open').length;
  const inProgress = reports.filter((r) => r.status === 'in_progress').length;
  const resolved = reports.filter((r) => r.status === 'resolved').length;
  const thisWeek = reports.filter((r) => {
    const created = r.createdAt?.toDate?.() || new Date(r.createdAt);
    return created >= weekAgo;
  }).length;

  const categoryBreakdown = reports.reduce(
    (acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return { total, open, inProgress, resolved, thisWeek, categoryBreakdown };
}
