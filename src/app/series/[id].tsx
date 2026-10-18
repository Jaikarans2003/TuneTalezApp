import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { EpisodePlayer } from '@/components/player/EpisodePlayer';
import { UnlockSheet } from '@/components/player/UnlockSheet';
import { colors } from '@/constants/colors';
import { issuePlayback, refreshPlaybackTokens, type PlaybackSession } from '@/lib/playback';
import { watchEpisodeHref } from '@/lib/routes';
import { mediaUrl, supabase } from '@/lib/supabase';
import { getContinueEpisodeForSeries } from '@/lib/watchHistory';
import { useAuth } from '@/providers/AuthProvider';
import type { Database } from '@/types/database';

type Series = Database['public']['Tables']['series']['Row'];
type Episode = Database['public']['Tables']['episodes']['Row'];

export default function SeriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const isWebWide = Platform.OS === 'web' && width >= 900;
  const { user, loading: authLoading } = useAuth();
  const [series, setSeries] = useState<Series | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [continueEp, setContinueEp] = useState<Episode | null>(null);
  const [inList, setInList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [webSession, setWebSession] = useState<PlaybackSession | null>(null);
  const [webEpisode, setWebEpisode] = useState<Episode | null>(null);
  const [unlockEp, setUnlockEp] = useState<Episode | null>(null);

  const refreshListState = useCallback(async () => {
    if (!user || !id) {
      setInList(false);
      return;
    }
    const { data } = await supabase
      .from('my_list')
      .select('id')
      .eq('user_id', user.id)
      .eq('series_id', id)
      .maybeSingle();
    setInList(!!data);
  }, [id, user]);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    void (async () => {
      const [{ data: seriesRow, error: seriesError }, { data: episodeRows, error: epError }] =
        await Promise.all([
          supabase.from('series').select('*').eq('id', id).maybeSingle(),
          supabase
            .from('episodes')
            .select('*')
            .eq('series_id', id)
            .order('episode_number', { ascending: true }),
        ]);
      if (!mounted) return;
      if (seriesError || epError) {
        setError(seriesError?.message ?? epError?.message ?? 'Failed to load');
      } else {
        setSeries(seriesRow);
        setEpisodes(episodeRows ?? []);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const firstEpisode = useMemo(
    () => episodes.find((e) => e.episode_number === 1) ?? null,
    [episodes],
  );

  useFocusEffect(
    useCallback(() => {
      if (authLoading) return;
      void refreshListState();
      if (!user || !id || episodes.length === 0) return;
      void getContinueEpisodeForSeries(user.id, id, episodes).then(setContinueEp);
    }, [authLoading, refreshListState, user, id, episodes]),
  );

  async function toggleMyList() {
    if (!user) {
      router.push('/sign-in');
      return;
    }
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      if (inList) {
        const { error: delError } = await supabase
          .from('my_list')
          .delete()
          .eq('user_id', user.id)
          .eq('series_id', id);
        if (delError) throw delError;
        setInList(false);
      } else {
        const { error: insError } = await supabase.from('my_list').insert({
          user_id: user.id,
          series_id: id,
        });
        if (insError) throw insError;
        setInList(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update My List');
    } finally {
      setBusy(false);
    }
  }

  function openEpisode(ep: Episode) {
    if (!ep.is_free) {
      setUnlockEp(ep);
      return;
    }
    if (isWebWide) {
      void playWebEpisode(ep);
      return;
    }
    router.push(watchEpisodeHref(ep.id));
  }

  async function playWebEpisode(ep: Episode) {
    setWebEpisode(ep);
    setWebSession(null);
    try {
      const session = await issuePlayback(ep.id);
      setWebSession(session);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Playback failed');
    }
  }

  const playTarget = continueEp ?? firstEpisode;
  const playLabel =
    continueEp && continueEp.episode_number > 1
      ? `Continue EP ${continueEp.episode_number}`
      : 'Play EP 1';

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  if (!series) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error ?? 'Series not found'}</Text>
      </View>
    );
  }

  const poster = mediaUrl(series.poster_path);

  const details = (
    <>
      {!isWebWide && poster ? (
        <Image source={{ uri: poster }} style={styles.poster} contentFit="cover" />
      ) : !isWebWide ? (
        <View style={[styles.poster, styles.posterFallback]} />
      ) : null}
      <Text style={styles.title}>{series.title}</Text>
      <Text style={styles.synopsis}>{series.synopsis}</Text>

      {playTarget ? (
        <Pressable style={styles.playButton} onPress={() => openEpisode(playTarget)}>
          <Text style={styles.playButtonText}>{playLabel}</Text>
        </Pressable>
      ) : null}

      <Pressable style={styles.button} disabled={busy} onPress={() => void toggleMyList()}>
        <Text style={styles.buttonText}>
          {!user ? 'Sign in to save' : inList ? 'Remove from My List' : 'Save to My List'}
        </Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.section}>Episodes</Text>
      {episodes.map((ep) => (
        <Pressable key={ep.id} style={styles.episode} onPress={() => openEpisode(ep)}>
          <Text style={styles.episodeTitle}>
            {ep.episode_number}. {ep.title}
          </Text>
          <Text style={styles.episodeMeta}>
            {ep.is_free ? 'Free' : 'Locked'} · {ep.duration_seconds ?? 0}s
          </Text>
        </Pressable>
      ))}
    </>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={isWebWide ? styles.webRow : styles.content}>
      {isWebWide ? (
        <View style={styles.webPlayerCol}>
          {webSession && webEpisode ? (
            <EpisodePlayer
              key={webSession.playbackUrl}
              session={webSession}
              onError={() => void refreshPlaybackTokens(webEpisode.id).then(setWebSession)}
            />
          ) : (
            <View style={styles.webPlayerPlaceholder}>
              <Text style={styles.webPlayerHint}>Select a free episode to play</Text>
            </View>
          )}
        </View>
      ) : null}
      <View style={isWebWide ? styles.webDetailsCol : undefined}>{details}</View>

      <UnlockSheet
        visible={!!unlockEp}
        episodeTitle={unlockEp?.title}
        onClose={() => setUnlockEp(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
    gap: 12,
  },
  webRow: {
    flexDirection: 'row',
    padding: 24,
    gap: 24,
    alignItems: 'flex-start',
  },
  webPlayerCol: {
    flex: 1,
    minHeight: 480,
    maxWidth: 420,
    aspectRatio: 9 / 16,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  webPlayerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  webPlayerHint: {
    color: colors.textMuted,
    textAlign: 'center',
  },
  webDetailsCol: {
    flex: 1,
    gap: 12,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  poster: {
    width: '100%',
    aspectRatio: 9 / 16,
    maxHeight: 360,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignSelf: 'center',
  },
  posterFallback: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '600',
  },
  synopsis: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  playButton: {
    backgroundColor: colors.text,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  playButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
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
  section: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  episode: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 10,
    gap: 4,
  },
  episodeTitle: {
    color: colors.text,
    fontSize: 15,
  },
  episodeMeta: {
    color: colors.textMuted,
    fontSize: 13,
  },
  error: {
    color: '#B00020',
  },
});
