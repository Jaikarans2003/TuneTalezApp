import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

/**
 * Deep-link target after Google OAuth in Expo Go
 * (exp://…/--/auth/callback?code=…). Exchanges the PKCE code, then leaves.
 */
export default function AuthCallbackScreen() {
  const { code, error: oauthError, error_description } = useLocalSearchParams<{
    code?: string | string[];
    error?: string | string[];
    error_description?: string | string[];
  }>();
  const [message, setMessage] = useState('Finishing sign-in…');

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const err = Array.isArray(oauthError) ? oauthError[0] : oauthError;
      const errDesc = Array.isArray(error_description)
        ? error_description[0]
        : error_description;
      if (err) {
        if (!cancelled) setMessage(errDesc || err);
        return;
      }

      const raw = Array.isArray(code) ? code[0] : code;
      if (!raw) {
        if (!cancelled) setMessage('Missing auth code.');
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(raw);
      if (cancelled) return;
      if (error) {
        setMessage(error.message);
        return;
      }

      if (router.canDismiss()) router.dismissAll();
      router.replace('/(tabs)/profile');
    })();

    return () => {
      cancelled = true;
    };
  }, [code, oauthError, error_description]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.text} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  message: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
});
