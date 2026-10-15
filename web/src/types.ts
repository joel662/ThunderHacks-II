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

export const CATEGORY_COLORS: Record<ReportCategory, string> = {
  pothole: '#e94560',
  streetlight: '#f5a623',
  graffiti: '#a855f7',
  garbage: '#6b7280',
  sidewalk: '#f97316',
  traffic_sign: '#3b82f6',
  water: '#06b6d4',
  noise: '#ec4899',
  park: '#22c55e',
  other: '#8b5cf6',
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
  type?: 'comment' | 'status_update';
  imageUrl?: string;
  statusChange?: { from: ReportStatus; to: ReportStatus };
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  createdAt: any;
  reportCount: number;
  isAdmin: boolean;
}

export const BRAMPTON_CENTER = {
  latitude: 43.6858,
  longitude: -79.7593,
};

export type ReportStatus = Report['status'];

export type SortOption = 'newest' | 'oldest' | 'most_upvoted' | 'most_commented';

export interface FilterState {
  search: string;
  categories: ReportCategory[];
  status: ReportStatus | 'all';
  dateFrom: string;
  dateTo: string;
  minUpvotes: number;
  sortBy: SortOption;
}
