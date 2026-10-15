export type ReportCategory =
  | 'pothole'
  | 'streetlight'
  | 'graffiti'
  | 'garbage'
  | 'sidewalk'
  | 'traffic_sign'
  | 'water'
  | 'noise'
  | 'park'
  | 'other';

export const CATEGORY_LABELS: Record<ReportCategory, string> = {
  pothole: 'Pothole',
  streetlight: 'Broken Streetlight',
  graffiti: 'Graffiti',
  garbage: 'Garbage / Illegal Dumping',
  sidewalk: 'Sidewalk Damage',
  traffic_sign: 'Traffic Sign Issue',
  water: 'Water / Flooding',
  noise: 'Noise Complaint',
  park: 'Park Maintenance',
  other: 'Other',
};

export const CATEGORY_ICONS: Record<ReportCategory, string> = {
  pothole: '🕳️',
  streetlight: '💡',
  graffiti: '🎨',
  garbage: '🗑️',
  sidewalk: '🚶',
  traffic_sign: '🚦',
  water: '💧',
  noise: '🔊',
  park: '🌳',
  other: '📋',
};

export interface GeoLocation {
  latitude: number;
  longitude: number;
  geohash: string;
  address: string;
}

export interface ReportMedia {
  url: string;
  type: 'image' | 'video';
  thumbnailUrl?: string;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  category: ReportCategory;
  location: GeoLocation;
  media: ReportMedia[];
  authorId: string;
  authorName: string;
  upvoteCount: number;
  commentCount: number;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: any;
  updatedAt: any;
}

export interface Comment {
  id: string;
  reportId: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  createdAt: any;
  reportCount: number;
  isAdmin: boolean;
}

export interface Upvote {
  userId: string;
  reportId: string;
  createdAt: any;
}

export const BRAMPTON_CENTER = {
  latitude: 43.7315,
  longitude: -79.7624,
};

export const DEFAULT_RADIUS_KM = 1;
export const MAX_RADIUS_KM = 5;
