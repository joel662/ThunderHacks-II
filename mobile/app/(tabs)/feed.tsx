import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { getAllReports } from '../../src/services/reports';
import ReportCard from '../../src/components/ReportCard';
import { useTheme, type ThemeColors } from '../../src/contexts/ThemeContext';
import {
  Report,
  ReportCategory,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  BRAMPTON_CENTER,
} from '../../src/types';

const BRAMPTON_BOUNDS = {
  minLat: 43.60, maxLat: 43.85,
  minLng: -79.87, maxLng: -79.58,
};

const ALL_CATEGORIES: ReportCategory[] = [
  'pothole', 'streetlight', 'graffiti', 'garbage', 'sidewalk',
  'traffic_sign', 'water', 'noise', 'park', 'other',
];

export default function FeedScreen() {
  const { colors } = useTheme();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLat, setUserLat] = useState(BRAMPTON_CENTER.latitude);
  const [userLng, setUserLng] = useState(BRAMPTON_CENTER.longitude);
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
  const s = makeStyles(colors);

  const fetchReports = useCallback(async () => {
    try {
      const data = await getAllReports();
      setReports(data);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    }
  }, []);

  const init = useCallback(async () => {
    setLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    let lat = BRAMPTON_CENTER.latitude;
    let lng = BRAMPTON_CENTER.longitude;

    if (status === 'granted') {
      try {
        const loc = await Location.getCurrentPositionAsync({});
        const inBrampton = loc.coords.latitude >= BRAMPTON_BOUNDS.minLat &&
          loc.coords.latitude <= BRAMPTON_BOUNDS.maxLat &&
          loc.coords.longitude >= BRAMPTON_BOUNDS.minLng &&
          loc.coords.longitude <= BRAMPTON_BOUNDS.maxLng;
        if (inBrampton) {
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
        }
      } catch {}
    }

    setUserLat(lat);
    setUserLng(lng);
    await fetchReports();
    setLoading(false);
  }, [fetchReports]);

  useEffect(() => {
    init();
  }, [init]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  };

  const filteredReports = selectedCategory
    ? reports.filter((r) => r.category === selectedCategory)
    : reports;

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Feed</Text>
        <Text style={s.subtitle}>Issues near you</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filterBar}
        contentContainerStyle={s.filterContent}
      >
        <TouchableOpacity
          style={[s.chip, !selectedCategory && s.chipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[s.chipText, !selectedCategory && s.chipTextActive]}>All</Text>
        </TouchableOpacity>
        {ALL_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[s.chip, selectedCategory === cat && s.chipActive]}
            onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
          >
            <Text style={s.chipIcon}>{CATEGORY_ICONS[cat]}</Text>
            <Text style={[s.chipText, selectedCategory === cat && s.chipTextActive]}>
              {CATEGORY_LABELS[cat].split(' ')[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredReports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ReportCard report={item} userLat={userLat} userLng={userLng} />
        )}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📭</Text>
            <Text style={s.emptyText}>No reports nearby</Text>
            <Text style={s.emptyHint}>Be the first to report an issue!</Text>
          </View>
        }
      />
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.bg },
    header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8 },
    title: { fontSize: 24, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 13, color: c.textSecondary, marginTop: 2 },
    filterBar: { maxHeight: 44, paddingHorizontal: 16, marginBottom: 8 },
    filterContent: { alignItems: 'center', gap: 8 },
    chip: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: c.chipBg,
      borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
      marginRight: 8, borderWidth: 1, borderColor: c.inputBorder,
    },
    chipActive: { backgroundColor: c.chipActiveBg, borderColor: c.chipActiveBg },
    chipIcon: { fontSize: 14, marginRight: 4 },
    chipText: { color: c.chipText, fontSize: 13, fontWeight: '600' },
    chipTextActive: { color: c.chipActiveText },
    list: { paddingHorizontal: 16, paddingBottom: 20 },
    empty: { alignItems: 'center', paddingTop: 80 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 18, fontWeight: '700', color: c.text },
    emptyHint: { fontSize: 14, color: c.textSecondary, marginTop: 4 },
  });
}
