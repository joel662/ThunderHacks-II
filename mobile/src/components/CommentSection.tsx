import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, type ThemeColors } from '../contexts/ThemeContext';
import { addComment, onCommentsChange } from '../services/comments';
import { Comment } from '../types';
import { timeAgo } from '../utils/geo';

interface Props {
  reportId: string;
}

export default function CommentSection({ reportId }: Props) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const s = makeStyles(colors);

  useEffect(() => {
    const unsub = onCommentsChange(reportId, (data) => {
      setComments(data);
      setLoading(false);
    });
    return unsub;
  }, [reportId]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user) return;
    setSending(true);
    try {
      await addComment(reportId, trimmed, user.uid, user.displayName);
      setText('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <View>
      <Text style={s.heading}>Comments</Text>

      {loading ? (
        <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 16 }} />
      ) : comments.length === 0 ? (
        <Text style={s.emptyText}>No comments yet. Be the first!</Text>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const ago =
              item.createdAt instanceof Timestamp
                ? timeAgo(item.createdAt.toDate())
                : item.createdAt instanceof Date
                ? timeAgo(item.createdAt)
                : '';
            return (
              <View style={s.comment}>
                <View style={s.commentAvatar}>
                  <Text style={s.commentAvatarText}>
                    {item.authorName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={s.commentBody}>
                  <View style={s.commentHeader}>
                    <Text style={s.commentAuthor}>{item.authorName}</Text>
                    <Text style={s.commentTime}>{ago}</Text>
                  </View>
                  <Text style={s.commentText}>{item.text}</Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder="Add a comment..."
          placeholderTextColor={colors.placeholder}
          value={text}
          onChangeText={setText}
          maxLength={500}
          multiline
        />
        <TouchableOpacity
          style={[s.sendBtn, (!text.trim() || sending) && s.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ fontSize: 18 }}>📤</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    heading: { fontSize: 16, fontWeight: '700', color: c.text, marginBottom: 12 },
    emptyText: { color: c.textSecondary, fontSize: 14, textAlign: 'center', paddingVertical: 20 },
    comment: { flexDirection: 'row', marginBottom: 14, gap: 10 },
    commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.avatarBg, justifyContent: 'center', alignItems: 'center' },
    commentAvatarText: { color: '#eee', fontSize: 14, fontWeight: '700' },
    commentBody: { flex: 1, backgroundColor: c.commentBubble, borderRadius: 12, padding: 10 },
    commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    commentAuthor: { color: c.accent, fontSize: 13, fontWeight: '700' },
    commentTime: { color: c.textSecondary, fontSize: 11, opacity: 0.7 },
    commentText: { color: c.text, fontSize: 14, lineHeight: 20, opacity: 0.85 },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 12, gap: 8 },
    input: {
      flex: 1, backgroundColor: c.inputBg, borderRadius: 20, paddingHorizontal: 16,
      paddingVertical: 10, fontSize: 14, color: c.text, maxHeight: 100,
      borderWidth: 1, borderColor: c.inputBorder,
    },
    sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.accent, justifyContent: 'center', alignItems: 'center' },
    sendBtnDisabled: { opacity: 0.4 },
  });
}
