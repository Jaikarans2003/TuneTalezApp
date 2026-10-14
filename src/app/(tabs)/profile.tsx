import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { signOut } from '@/lib/auth';
import { useAuth } from '@/providers/AuthProvider';

export default function ProfileScreen() {
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {user ? (
        <>
          <Text style={styles.subtitle}>{user.email ?? user.id}</Text>
          <Pressable
            style={styles.button}
            disabled={busy}
            onPress={() => {
              setBusy(true);
              setError(null);
              void signOut()
                .catch((e) => setError(e instanceof Error ? e.message : 'Sign out failed'))
                .finally(() => setBusy(false));
            }}>
            <Text style={styles.buttonText}>{busy ? 'Signing out…' : 'Sign out'}</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>Not signed in.</Text>
          <Link href="/sign-in" asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Sign in</Text>
            </Pressable>
          </Link>
        </>
      )}
      <Link href="/settings" asChild>
        <Pressable style={styles.secondary}>
          <Text style={styles.buttonText}>Settings</Text>
        </Pressable>
      </Link>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
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
    marginBottom: 8,
  },
  button: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondary: {
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
  error: {
    color: '#B00020',
  },
});
