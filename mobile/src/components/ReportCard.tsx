import { Image, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import { Report, CATEGORY_ICONS, CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import { distanceKm, formatDistance, timeAgo } from '../utils/geo';
import { useTheme, type ThemeColors } from '../contexts/ThemeContext';

interface Props {
  report: Report;
  userLat: number;
  userLng: number;
}

export default function ReportCard({ report, userLat, userLng }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const dist = distanceKm(
    userLat, userLng,
    report.location.latitude, report.location.longitude
  );

  const createdAt = report.createdAt instanceof Timestamp
    ? timeAgo(report.createdAt.toDate())
    : report.createdAt instanceof Date
    ? timeAgo(report.createdAt)
    : '';

  const thumbnail = report.media?.[0]?.url;

  return (
    <TouchableOpacity
      style={s.card}
      activeOpacity={0.7}
      onPress={() => router.push(`/report/${report.id}`)}
    >
      {thumbnail ? (
        <Image source={{ uri: thumbnail }} style={s.thumbnail} />
      ) : (
        <View style={[s.thumbnail, s.placeholderThumb]}>
          <Text style={s.placeholderIcon}>{CATEGORY_ICONS[report.category]}</Text>
        </View>
      )}

      <View style={s.info}>
        <View style={s.topRow}>
          <View
            style={[
              s.categoryBadge,
              { backgroundColor: CATEGORY_COLORS[report.category] + '22' },
            ]}
          >
            <Text style={s.badgeIcon}>{CATEGORY_ICONS[report.category]}</Text>
            <Text
              style={[s.badgeText, { color: CATEGORY_COLORS[report.category] }]}
            >
              {CATEGORY_LABELS[report.category].split('/')[0].trim()}
            </Text>
          </View>
        </View>

        <Text style={s.title} numberOfLines={2}>{report.title}</Text>

        <View style={s.bottomRow}>
          <View style={s.statItem}>
            <Text style={{ fontSize: 13 }}>👍</Text>
            <Text style={s.statText}>{report.upvoteCount}</Text>
          </View>
          <View style={s.statItem}>
            <Text style={{ fontSize: 13 }}>💬</Text>
            <Text style={s.statText}>{report.commentCount}</Text>
          </View>
          <Text style={s.distance}>{formatDistance(dist)}</Text>
          <Text style={s.time}>{createdAt}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    card: { flexDirection: 'row', backgroundColor: c.card, borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
    thumbnail: { width: 100, height: 100 },
    placeholderThumb: { backgroundColor: c.secondary, justifyContent: 'center', alignItems: 'center' },
    placeholderIcon: { fontSize: 32 },
    info: { flex: 1, padding: 12, justifyContent: 'space-between' },
    topRow: { flexDirection: 'row' },
    categoryBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, gap: 4 },
    badgeIcon: { fontSize: 11 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    title: { fontSize: 14, fontWeight: '700', color: c.text, lineHeight: 18 },
    bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    statText: { color: c.textSecondary, fontSize: 12, fontWeight: '600' },
    distance: { color: c.textSecondary, fontSize: 11, opacity: 0.7 },
    time: { color: c.textSecondary, fontSize: 11, marginLeft: 'auto', opacity: 0.7 },
  });
}
