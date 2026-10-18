import { Image } from 'expo-image';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '@/constants/colors';
import { watchEpisodeHref } from '@/lib/routes';
import { mediaUrl, supabase } from '@/lib/supabase';
import {
  clearAllWatchHistory,
  deleteWatchHistoryEntry,
  fetchHistoryBySeries,
  type HistoryRow,
} from '@/lib/watchHistory';
import { useAuth } from '@/providers/AuthProvider';
import type { Database } from '@/types/database';

type Series = Database['public']['Tables']['series']['Row'];

type ListRow = {
  series_id: string;
  series: Series | null;
};

type Segment = 'saved' | 'history';

export default function MyListScreen() {
  const { user, loading: authLoading } = useAuth();
  const [segment, setSegment] = useState<Segment>('saved');
  const [rows, setRows] = useState<ListRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSaved = useCallback(async () => {
    if (!user) {
      setRows([]);
      return;
    }
    const { data, error: qError } = await supabase
      .from('my_list')
      .select('series_id, series(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (qError) setError(qError.message);
    else setRows((data as ListRow[] | null) ?? []);
  }, [user]);

  const loadHistory = useCallback(async () => {
    if (!user) {
      setHistory([]);
      return;
    }
    try {
      setHistory(await fetchHistoryBySeries(user.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load history');
    }
  }, [user]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([loadSaved(), loadHistory()]);
    setLoading(false);
  }, [loadSaved, loadHistory]);

  useFocusEffect(
    useCallback(() => {
      if (authLoading) return;
      void load();
    }, [authLoading, load]),
  );

  function confirmClearHistory() {
    if (!user) return;
    Alert.alert('Clear history?', 'Remove all watch history on this account.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await clearAllWatchHistory(user.id);
            await loadHistory();
          })();
        },
      },
    ]);
  }

  if (authLoading || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>My List</Text>
        <Text style={styles.subtitle}>Sign in to save series and sync history.</Text>
        <Link href="/sign-in" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Sign in</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.segments}>
        <Pressable
          style={[styles.segment, segment === 'saved' && styles.segmentActive]}
          onPress={() => setSegment('saved')}>
          <Text style={[styles.segmentText, segment === 'saved' && styles.segmentTextActive]}>
            Saved
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segment, segment === 'history' && styles.segmentActive]}
          onPress={() => setSegment('history')}>
          <Text style={[styles.segmentText, segment === 'history' && styles.segmentTextActive]}>
            History
          </Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {segment === 'saved' ? (
        rows.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.subtitle}>Nothing saved yet. Open a series and tap Save.</Text>
          </View>
        ) : (
          <FlatList
            style={styles.list}
            contentContainerStyle={styles.listContent}
            data={rows}
            keyExtractor={(item) => item.series_id}
            renderItem={({ item }) => {
              const s = item.series;
              if (!s) return null;
              const poster = mediaUrl(s.poster_path);
              return (
                <Link href={`/series/${s.id}`} asChild>
                  <Pressable style={styles.row}>
                    {poster ? (
                      <Image source={{ uri: poster }} style={styles.thumb} contentFit="cover" />
                    ) : (
                      <View style={[styles.thumb, styles.thumbFallback]} />
                    )}
                    <Text style={styles.rowTitle}>{s.title}</Text>
                  </Pressable>
                </Link>
              );
            }}
          />
        )
      ) : (
        <>
          {history.length > 0 ? (
            <Pressable style={styles.clearBtn} onPress={confirmClearHistory}>
              <Text style={styles.clearBtnText}>Clear all</Text>
            </Pressable>
          ) : null}
          {history.length === 0 ? (
            <View style={styles.centered}>
              <Text style={styles.subtitle}>No watch history yet.</Text>
            </View>
          ) : (
            <FlatList
              style={styles.list}
              contentContainerStyle={styles.listContent}
              data={history}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const s = item.episode.series;
                if (!s) return null;
                const poster = mediaUrl(s.poster_path);
                return (
                  <View style={styles.historyRow}>
                    <Link href={watchEpisodeHref(item.episode.id)} asChild>
                      <Pressable style={styles.row}>
                        {poster ? (
                          <Image source={{ uri: poster }} style={styles.thumb} contentFit="cover" />
                        ) : (
                          <View style={[styles.thumb, styles.thumbFallback]} />
                        )}
                        <View style={styles.rowBody}>
                          <Text style={styles.rowTitle}>{s.title}</Text>
                          <Text style={styles.rowMeta}>
                            EP {item.episode.episode_number} ·{' '}
                            {new Date(item.last_watched_at).toLocaleDateString()}
                          </Text>
                        </View>
                      </Pressable>
                    </Link>
                    <Pressable
                      style={styles.removeBtn}
                      onPress={() => void deleteWatchHistoryEntry(item.id).then(loadHistory)}>
                      <Text style={styles.removeBtnText}>Remove</Text>
                    </Pressable>
                  </View>
                );
              }}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  segments: {
    flexDirection: 'row',
    margin: 16,
    gap: 8,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.surface,
  },
  segmentText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: colors.text,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  centered: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  thumb: {
    width: 56,
    height: 84,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  thumbFallback: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  rowMeta: {
    color: colors.textMuted,
    fontSize: 13,
  },
  removeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  removeBtnText: {
    color: '#B00020',
    fontWeight: '600',
  },
  clearBtn: {
    alignSelf: 'flex-end',
    marginRight: 16,
    marginBottom: 4,
  },
  clearBtnText: {
    color: '#B00020',
    fontWeight: '600',
  },
  error: {
    color: '#B00020',
    paddingHorizontal: 16,
  },
});
