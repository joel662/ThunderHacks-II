import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { Report, ReportCategory, ReportMedia } from '../types';
import { encodeGeohash, getGeohashRange, distanceKm } from '../utils/geo';
import { isDemoMode } from '../lib/demo';
import { MOCK_REPORTS } from '../data/mockData';

const REPORTS_COL = 'reports';

interface CreateReportData {
  title: string;
  description: string;
  category: ReportCategory;
  latitude: number;
  longitude: number;
  address: string;
  authorId: string;
  authorName: string;
}

interface MediaFile {
  uri: string;
  type: 'image' | 'video';
  fileName?: string;
}

async function uploadMedia(reportId: string, files: MediaFile[]): Promise<ReportMedia[]> {
  const results: ReportMedia[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.type === 'video' ? 'mp4' : 'jpg';
    const path = `reports/${reportId}/${i}.${ext}`;
    const storageRef = ref(storage, path);

    const response = await fetch(file.uri);
    const blob = await response.blob();
    const contentType = file.type === 'video' ? 'video/mp4' : 'image/jpeg';
    await uploadBytes(storageRef, blob, { contentType });

    const url = await getDownloadURL(storageRef);
    results.push({ url, type: file.type });
  }

  return results;
}

export async function createReport(
  data: CreateReportData,
  mediaFiles: MediaFile[]
): Promise<string> {
  const geohash = encodeGeohash(data.latitude, data.longitude);

  const reportRef = await addDoc(collection(db, REPORTS_COL), {
    title: data.title,
    description: data.description,
    category: data.category,
    location: {
      latitude: data.latitude,
      longitude: data.longitude,
      geohash,
      address: data.address,
    },
    media: [],
    authorId: data.authorId,
    authorName: data.authorName,
    upvoteCount: 0,
    commentCount: 0,
    status: 'open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (mediaFiles.length > 0) {
    const media = await uploadMedia(reportRef.id, mediaFiles);
    await updateDoc(reportRef, { media });
  }

  return reportRef.id;
}

export async function getReportsNearby(
  lat: number,
  lng: number,
  radiusKm: number
): Promise<Report[]> {
  if (isDemoMode()) {
    return MOCK_REPORTS.filter(
      (r) => distanceKm(lat, lng, r.location.latitude, r.location.longitude) <= radiusKm
    );
  }

  const { lower, upper } = getGeohashRange(lat, lng, radiusKm);

  const q = query(
    collection(db, REPORTS_COL),
    where('location.geohash', '>=', lower),
    where('location.geohash', '<=', upper + ''),
    orderBy('location.geohash'),
  );

  const snapshot = await getDocs(q);
  const reports: Report[] = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const dist = distanceKm(lat, lng, data.location.latitude, data.location.longitude);
    if (dist <= radiusKm) {
      reports.push({ id: docSnap.id, ...data } as Report);
    }
  });

  reports.sort((a, b) => {
    const aTime = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
    const bTime = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
    return bTime - aTime;
  });

  return reports;
}

export async function getReport(id: string): Promise<Report | null> {
  if (isDemoMode()) {
    return MOCK_REPORTS.find((r) => r.id === id) || null;
  }
  const docSnap = await getDoc(doc(db, REPORTS_COL, id));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Report;
}

export async function getAllReports(): Promise<Report[]> {
  if (isDemoMode()) {
    return MOCK_REPORTS;
  }
  const q = query(
    collection(db, REPORTS_COL),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Report));
}

export async function getUserReports(userId: string): Promise<Report[]> {
  if (isDemoMode()) {
    return MOCK_REPORTS.filter((r) => r.authorId === userId);
  }
  const q = query(
    collection(db, REPORTS_COL),
    where('authorId', '==', userId),
  );
  const snapshot = await getDocs(q);
  const reports = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Report));
  reports.sort((a, b) => {
    const aTime = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
    const bTime = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
    return bTime - aTime;
  });
  return reports;
}

export async function updateReportStatus(
  id: string,
  status: Report['status']
): Promise<void> {
  await updateDoc(doc(db, REPORTS_COL, id), {
    status,
    updatedAt: serverTimestamp(),
  });
}
