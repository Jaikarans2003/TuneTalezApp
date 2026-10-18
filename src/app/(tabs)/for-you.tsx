import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';

import { EpisodePlayer } from '@/components/player/EpisodePlayer';
import { colors } from '@/constants/colors';
import { issuePlayback, refreshPlayback, type PlaybackSession } from '@/lib/playback';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import type { Database } from '@/types/database';

type Series = Database['public']['Tables']['series']['Row'];
type Episode = Database['public']['Tables']['episodes']['Row'];

type FeedItem = {
  series: Series;
  episode: Episode;
};

const { height: WINDOW_HEIGHT } = Dimensions.get('window');

export default function ForYouScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Record<string, PlaybackSession>>({});
  const loadingRef = useRef(new Set<string>());

  const ensureSession = useCallback(async (episodeId: string) => {
    // loadingRef doubles as in-flight + already-issued guard
    if (loadingRef.current.has(episodeId)) return;
    loadingRef.current.add(episodeId);
    try {
      const session = await issuePlayback(episodeId);
      setSessions((prev) => ({ ...prev, [episodeId]: session }));
    } catch {
      loadingRef.current.delete(episodeId);
      // Stream not wired yet — feed still shows metadata
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const { data: seriesRows, error: sErr } = await supabase
        .from('series')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

      if (!mounted) return;
      if (sErr) {
        setError(sErr.message);
        setLoading(false);
        return;
      }

      const feed: FeedItem[] = [];
      for (const series of seriesRows ?? []) {
        const { data: ep } = await supabase
          .from('episodes')
          .select('*')
          .eq('series_id', series.id)
          .eq('episode_number', 1)
          .maybeSingle();
        if (ep?.is_free) feed.push({ series, episode: ep });
      }
      if (!mounted) return;
      setItems(feed);
      const firstId = feed[0]?.episode.id ?? null;
      setActiveId(firstId);
      setLoading(false);
      if (firstId) void ensureSession(firstId);
    })();
    return () => {
      mounted = false;
    };
  }, [ensureSession]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0]?.item as FeedItem | undefined;
      if (!first) return;
      setActiveId(first.episode.id);
      void ensureSession(first.episode.id);
    },
    [ensureSession],
  );

  async function toggleSave(seriesId: string) {
    if (!user) {
      router.push('/sign-in');
      return;
    }
    const { data: existing } = await supabase
      .from('my_list')
      .select('id')
      .eq('user_id', user.id)
      .eq('series_id', seriesId)
      .maybeSingle();
    if (existing) {
      await supabase.from('my_list').delete().eq('id', existing.id);
    } else {
      await supabase.from('my_list').insert({ user_id: user.id, series_id: seriesId });
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.subtitle}>No previews yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.episode.id}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      snapToInterval={WINDOW_HEIGHT}
      decelerationRate="fast"
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
      renderItem={({ item }) => {
        const session = sessions[item.episode.id];
        const isActive = item.episode.id === activeId;

        return (
          <View style={[styles.page, { height: WINDOW_HEIGHT }]}>
            {isActive && session ? (
              <EpisodePlayer
                key={session.hlsUrl}
                session={session}
                onError={() =>
                  void refreshPlayback(item.episode.id).then((s) =>
                    setSessions((prev) => ({ ...prev, [item.episode.id]: s })),
                  )
                }
              />
            ) : (
              <View style={styles.posterFallback} />
            )}

            <View style={styles.overlay}>
              <Text style={styles.seriesTitle}>{item.series.title}</Text>
              <Text style={styles.epLabel}>Episode 1 preview</Text>
              <View style={styles.actions}>
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => router.push(`/series/${item.series.id}`)}>
                  <Text style={styles.actionText}>Watch full series</Text>
                </Pressable>
                <Pressable style={styles.actionBtn} onPress={() => void toggleSave(item.series.id)}>
                  <Text style={styles.actionText}>Save</Text>
                </Pressable>
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => void Share.share({ message: item.series.title })}>
                  <Text style={styles.actionText}>Share</Text>
                </Pressable>
                <Pressable style={styles.actionBtn}>
                  <Text style={styles.actionText}>Like</Text>
                </Pressable>
              </View>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#000',
  },
  posterFallback: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  overlay: {
    position: 'absolute',
    bottom: 48,
    left: 16,
    right: 16,
    gap: 8,
  },
  seriesTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  epLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  actionBtn: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  subtitle: {
    color: colors.textMuted,
  },
  error: {
    color: '#B00020',
  },
});
