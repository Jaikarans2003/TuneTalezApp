import { Image } from 'expo-image';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
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
import { useAuth } from '@/providers/AuthProvider';
import type { Database } from '@/types/database';

type Series = Database['public']['Tables']['series']['Row'];

type ListRow = {
  series_id: string;
  series: Series | null;
};

export default function MyListScreen() {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<ListRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: qError } = await supabase
      .from('my_list')
      .select('series_id, series(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (qError) setError(qError.message);
    else setRows((data as ListRow[] | null) ?? []);
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (authLoading) return;
      void load();
    }, [authLoading, load]),
  );

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
        <Text style={styles.subtitle}>Sign in to save series.</Text>
        <Link href="/sign-in" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Sign in</Text>
          </Pressable>
        </Link>
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

  if (rows.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>My List</Text>
        <Text style={styles.subtitle}>Nothing saved yet. Open a series and tap Save.</Text>
      </View>
    );
  }

  return (
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
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
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
  error: {
    color: '#B00020',
  },
});
