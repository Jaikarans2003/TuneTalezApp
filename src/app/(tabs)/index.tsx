import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '@/constants/colors';
import { mediaUrl, supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Series = Database['public']['Tables']['series']['Row'];

export default function HomeScreen() {
  const [series, setSeries] = useState<Series[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const { data, error: qError } = await supabase
          .from('series')
          .select('*')
          .eq('is_published', true)
          .order('sort_order', { ascending: true });
        if (!mounted) return;
        if (qError) setError(qError.message);
        else setSeries(data ?? []);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Failed to load series');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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

  return (
    <View style={styles.container}>
      <Text style={styles.railTitle}>Series</Text>
      <FlatList
        horizontal
        data={series}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
        renderItem={({ item }) => {
          const poster = mediaUrl(item.poster_path);
          return (
            <Link href={`/series/${item.id}`} asChild>
              <Pressable style={styles.card}>
                {poster ? (
                  <Image source={{ uri: poster }} style={styles.poster} contentFit="cover" />
                ) : (
                  <View style={[styles.poster, styles.posterFallback]} />
                )}
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
              </Pressable>
            </Link>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 16,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  railTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  rail: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: 140,
    gap: 8,
  },
  poster: {
    width: 140,
    height: 210,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  posterFallback: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  error: {
    color: '#B00020',
    textAlign: 'center',
  },
});
