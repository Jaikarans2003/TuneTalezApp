import Constants, { ExecutionEnvironment } from 'expo-constants';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export const MIN_PASSWORD_LENGTH = 8;

/**
 * Redirect rules (Supabase GoTrue):
 * - Non-loopback IP hosts (exp://192.168.x.x) are rejected BEFORE the allowlist.
 * - exp://localhost works for Supabase but on a physical phone Expo Go tries to
 *   download the bundle from the device → "Failed to download remote update".
 *
 * Expo Go Google OAuth therefore needs a hostname redirect (npx expo start --tunnel).
 * Dev/standalone builds use the tunetalez scheme.
 */
export function getOAuthRedirectTo() {
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  const redirectTo = makeRedirectUri({
    scheme: isExpoGo ? undefined : 'tunetalez',
    path: 'auth/callback',
  });
  console.log('[auth] redirectTo', redirectTo);
  if (
    isExpoGo &&
    (/^exp:\/\/\d+\.\d+\.\d+\.\d+/.test(redirectTo) || redirectTo.includes('localhost'))
  ) {
    console.warn(
      '[auth] Expo Go OAuth needs a tunnel hostname. Run: npx expo start --tunnel --port 8081',
    );
  }
  return redirectTo;
}

export async function exchangeSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);
  const { code } = params;
  if (!code) return null;
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
  return data.session;
}

/** Google via Supabase OAuth only — no @react-oauth/google or native Google SDKs. */
export async function signInWithGoogle() {
  const redirectTo = getOAuthRedirectTo();

  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw error;
    return;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;
  if (!data.url) throw new Error('No OAuth URL returned');

  try {
    const oauthUrl = new URL(data.url);
    console.log('[auth] oauth redirect_to', oauthUrl.searchParams.get('redirect_to'));
  } catch {
    /* ignore */
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === 'success') {
    await exchangeSessionFromUrl(result.url);
  }
}

export async function signUpWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
