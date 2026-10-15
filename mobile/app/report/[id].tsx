import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import { getReport } from '../../src/services/reports';
import { toggleUpvote, hasUpvoted } from '../../src/services/upvotes';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme, type ThemeColors } from '../../src/contexts/ThemeContext';
import MediaViewer from '../../src/components/MediaViewer';
import CommentSection from '../../src/components/CommentSection';
import { Report, CATEGORY_LABELS, CATEGORY_ICONS } from '../../src/types';
import { timeAgo } from '../../src/utils/geo';

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [upvoted, setUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [togglingVote, setTogglingVote] = useState(false);
  const s = makeStyles(colors);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await getReport(id);
        setReport(data);
        if (data) {
          setUpvoteCount(data.upvoteCount);
          if (user) {
            const voted = await hasUpvoted(id, user.uid);
            setUpvoted(voted);
          }
        }
      } catch (err) {
        console.error('Failed to load report:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user]);

  const handleUpvote = async () => {
    if (!user || !id || togglingVote) return;
    setTogglingVote(true);
    try {
      const nowUpvoted = await toggleUpvote(id, user.uid);
      setUpvoted(nowUpvoted);
      setUpvoteCount((prev) => prev + (nowUpvoted ? 1 : -1));
    } catch (err) {
      console.error('Failed to toggle upvote:', err);
    } finally {
      setTogglingVote(false);
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={s.center}>
        <Text style={s.errorText}>Report not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const createdAt = report.createdAt instanceof Timestamp
    ? timeAgo(report.createdAt.toDate())
    : report.createdAt instanceof Date
    ? timeAgo(report.createdAt)
    : '';

  return (
    <View style={s.container}>
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <Text style={{ fontSize: 20 }}>←</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={s.scroll}>
        {report.media.length > 0 && <MediaViewer media={report.media} />}

        <View style={s.content}>
          <View style={s.categoryRow}>
            <View style={s.categoryBadge}>
              <Text style={s.categoryIcon}>{CATEGORY_ICONS[report.category]}</Text>
              <Text style={s.categoryText}>{CATEGORY_LABELS[report.category]}</Text>
            </View>
            <View
              style={[
                s.statusBadge,
                report.status === 'resolved' && s.statusResolved,
                report.status === 'in_progress' && s.statusProgress,
              ]}
            >
              <Text style={s.statusText}>{report.status.replace('_', ' ')}</Text>
            </View>
          </View>

          <Text style={s.title}>{report.title}</Text>

          {report.description ? (
            <Text style={s.description}>{report.description}</Text>
          ) : null}

          <View style={s.metaRow}>
            <Text style={{ fontSize: 14 }}>📍</Text>
            <Text style={s.metaText}>{report.location.address}</Text>
          </View>
          <View style={s.metaRow}>
            <Text style={{ fontSize: 14 }}>👤</Text>
            <Text style={s.metaText}>{report.authorName}</Text>
            <Text style={s.metaDot}>·</Text>
            <Text style={s.metaText}>{createdAt}</Text>
          </View>

          <View style={s.actions}>
            <TouchableOpacity
              style={[s.upvoteBtn, upvoted && s.upvoteBtnActive]}
              onPress={handleUpvote}
              disabled={togglingVote}
            >
              <Text style={{ fontSize: 18, color: upvoted ? '#fff' : colors.accent }}>👍</Text>
              <Text style={[s.upvoteText, upvoted && s.upvoteTextActive]}>
                {upvoteCount}
              </Text>
            </TouchableOpacity>

            <View style={s.commentCount}>
              <Text style={{ fontSize: 17 }}>💬</Text>
              <Text style={s.commentCountText}>{report.commentCount}</Text>
            </View>
          </View>

          <View style={s.divider} />

          <CommentSection reportId={report.id} />
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.bg },
    errorText: { color: c.text, fontSize: 18, fontWeight: '700' },
    backLink: { color: c.accent, fontSize: 14, marginTop: 8 },
    backBtn: {
      position: 'absolute', top: 50, left: 16, zIndex: 10, width: 40, height: 40,
      borderRadius: 20, backgroundColor: c.card + 'cc', justifyContent: 'center', alignItems: 'center',
    },
    scroll: { paddingBottom: 40 },
    content: { padding: 20 },
    categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    categoryBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
    categoryIcon: { fontSize: 14 },
    categoryText: { color: c.text, fontSize: 13, fontWeight: '600', opacity: 0.8 },
    statusBadge: { backgroundColor: c.accent, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    statusResolved: { backgroundColor: '#2ed573' },
    statusProgress: { backgroundColor: '#ffd93d' },
    statusText: { fontSize: 11, fontWeight: '700', color: '#fff', textTransform: 'capitalize' },
    title: { fontSize: 22, fontWeight: '800', color: c.text, marginBottom: 8 },
    description: { fontSize: 15, color: c.textSecondary, lineHeight: 22, marginBottom: 16 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    metaText: { color: c.textSecondary, fontSize: 13 },
    metaDot: { color: c.textSecondary, fontSize: 13, opacity: 0.5 },
    actions: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 20 },
    upvoteBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: c.accent, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8, gap: 6 },
    upvoteBtnActive: { backgroundColor: c.accent },
    upvoteText: { fontSize: 16, fontWeight: '700', color: c.accent },
    upvoteTextActive: { color: '#fff' },
    commentCount: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    commentCountText: { color: c.textSecondary, fontSize: 15, fontWeight: '600' },
    divider: { height: 1, backgroundColor: c.divider, marginVertical: 20 },
  });
}
