import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme, type ThemeColors } from '../../src/contexts/ThemeContext';
import { getUserReports } from '../../src/services/reports';
import { Report, CATEGORY_ICONS, CATEGORY_LABELS } from '../../src/types';
import { Timestamp } from 'firebase/firestore';
import { timeAgo } from '../../src/utils/geo';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const s = makeStyles(colors);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const data = await getUserReports(user.uid);
        setReports(data);
      } catch (err) {
        console.error('Failed to fetch user reports:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const joinDate = user?.createdAt instanceof Timestamp
    ? user.createdAt.toDate().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
    : user?.createdAt instanceof Date
    ? user.createdAt.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown';

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>
            {user?.displayName?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={s.name}>{user?.displayName || 'Anonymous'}</Text>
        <Text style={s.meta}>Joined {joinDate}</Text>
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={s.statNum}>{reports.length}</Text>
            <Text style={s.statLabel}>Reports</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statNum}>
              {reports.reduce((sum, r) => sum + r.upvoteCount, 0)}
            </Text>
            <Text style={s.statLabel}>Total Upvotes</Text>
          </View>
        </View>
      </View>

      {/* Theme Toggle */}
      <View style={s.themeRow}>
        <View style={s.themeLeft}>
          <Text style={{ fontSize: 20 }}>{isDark ? '🌙' : '☀️'}</Text>
          <Text style={s.themeLabel}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
        </View>
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{ false: '#ccc', true: colors.accent + '66' }}
          thumbColor={isDark ? colors.accent : '#f4f3f4'}
        />
      </View>

      <Text style={s.sectionTitle}>Your Reports</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.reportRow}
              onPress={() => router.push(`/report/${item.id}`)}
            >
              <Text style={s.reportIcon}>{CATEGORY_ICONS[item.category]}</Text>
              <View style={s.reportInfo}>
                <Text style={s.reportTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={s.reportMeta}>
                  {CATEGORY_LABELS[item.category]} · ▲ {item.upvoteCount} ·{' '}
                  {item.createdAt instanceof Timestamp
                    ? timeAgo(item.createdAt.toDate())
                    : item.createdAt instanceof Date
                    ? timeAgo(item.createdAt)
                    : ''}
                </Text>
              </View>
              <View
                style={[
                  s.statusBadge,
                  item.status === 'resolved' && s.statusResolved,
                  item.status === 'in_progress' && s.statusProgress,
                ]}
              >
                <Text style={s.statusText}>{item.status.replace('_', ' ')}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>No reports yet</Text>
              <Text style={s.emptyHint}>Report your first neighbourhood issue!</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut}>
        <Text style={{ fontSize: 18 }}>🚪</Text>
        <Text style={s.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    header: { alignItems: 'center', paddingTop: 60, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: c.divider },
    avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: c.accent, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
    name: { fontSize: 22, fontWeight: '800', color: c.text },
    meta: { fontSize: 13, color: c.textSecondary, marginTop: 4 },
    statsRow: { flexDirection: 'row', marginTop: 16, gap: 40 },
    stat: { alignItems: 'center' },
    statNum: { fontSize: 20, fontWeight: '800', color: c.text },
    statLabel: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    themeRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.divider,
    },
    themeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    themeLabel: { fontSize: 15, fontWeight: '600', color: c.text },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: c.text, opacity: 0.8, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
    list: { paddingHorizontal: 16, paddingBottom: 20 },
    reportRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderRadius: 12, padding: 14, marginBottom: 8, gap: 12 },
    reportIcon: { fontSize: 24 },
    reportInfo: { flex: 1 },
    reportTitle: { fontSize: 15, fontWeight: '600', color: c.text },
    reportMeta: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    statusBadge: { backgroundColor: c.accent, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    statusResolved: { backgroundColor: '#2ed573' },
    statusProgress: { backgroundColor: '#ffd93d' },
    statusText: { fontSize: 10, fontWeight: '700', color: '#fff', textTransform: 'capitalize' },
    empty: { alignItems: 'center', paddingTop: 40 },
    emptyText: { fontSize: 16, fontWeight: '700', color: c.text },
    emptyHint: { fontSize: 13, color: c.textSecondary, marginTop: 4 },
    signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8, borderTopWidth: 1, borderTopColor: c.divider },
    signOutText: { color: c.accent, fontSize: 15, fontWeight: '600' },
  });
}
