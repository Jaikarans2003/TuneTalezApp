import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '@/constants/colors';
import { mediaUrl, supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import type { Database } from '@/types/database';

type Series = Database['public']['Tables']['series']['Row'];
type Episode = Database['public']['Tables']['episodes']['Row'];

export default function SeriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [series, setSeries] = useState<Series | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [inList, setInList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

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

  useFocusEffect(
    useCallback(() => {
      if (authLoading) return;
      void refreshListState();
    }, [authLoading, refreshListState]),
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {poster ? (
        <Image source={{ uri: poster }} style={styles.poster} contentFit="cover" />
      ) : (
        <View style={[styles.poster, styles.posterFallback]} />
      )}
      <Text style={styles.title}>{series.title}</Text>
      <Text style={styles.synopsis}>{series.synopsis}</Text>

      <Pressable style={styles.button} disabled={busy} onPress={() => void toggleMyList()}>
        <Text style={styles.buttonText}>
          {!user ? 'Sign in to save' : inList ? 'Remove from My List' : 'Save to My List'}
        </Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.section}>Episodes</Text>
      {episodes.map((ep) => (
        <View key={ep.id} style={styles.episode}>
          <Text style={styles.episodeTitle}>
            {ep.episode_number}. {ep.title}
          </Text>
          <Text style={styles.episodeMeta}>
            {ep.is_free ? 'Free' : 'Locked'} · {ep.duration_seconds ?? 0}s
          </Text>
        </View>
      ))}
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
