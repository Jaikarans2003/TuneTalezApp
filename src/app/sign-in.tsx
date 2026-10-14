import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors } from '@/constants/colors';
import {
  MIN_PASSWORD_LENGTH,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '@/lib/auth';
import { useAuth } from '@/providers/AuthProvider';

export default function SignInScreen() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Signed in</Text>
        <Text style={styles.hint}>{user.email}</Text>
        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </View>
    );
  }

  async function run(action: () => Promise<void>, opts?: { leaveOpen?: boolean }) {
    setBusy(true);
    setError(null);
    try {
      await action();
      // Web Google OAuth navigates away; don't pop the modal underneath that redirect.
      if (!opts?.leaveOpen) router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.hint}>Password must be at least {MIN_PASSWORD_LENGTH} characters.</Text>

      <TextInput
        style={styles.input}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor={colors.placeholder}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        secureTextEntry
        autoComplete="password"
        placeholder={`Password (min ${MIN_PASSWORD_LENGTH})`}
        placeholderTextColor={colors.placeholder}
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {busy ? <ActivityIndicator color={colors.text} /> : null}

      <Pressable
        style={styles.button}
        disabled={busy}
        onPress={() => run(() => signInWithEmail(email.trim(), password))}>
        <Text style={styles.buttonText}>Sign in with email</Text>
      </Pressable>
      <Pressable
        style={styles.secondary}
        disabled={busy}
        onPress={() => run(() => signUpWithEmail(email.trim(), password))}>
        <Text style={styles.buttonText}>Create account</Text>
      </Pressable>
      <Pressable
        style={styles.secondary}
        disabled={busy}
        onPress={() =>
          run(() => signInWithGoogle(), { leaveOpen: Platform.OS === 'web' })
        }>
        <Text style={styles.buttonText}>Continue with Google</Text>
      </Pressable>
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
  hint: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
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
    backgroundColor: colors.background,
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
    fontSize: 14,
  },
});
