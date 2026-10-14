import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export const MIN_PASSWORD_LENGTH = 8;

/**
 * Expo Go's default makeRedirectUri() is exp://<LAN_IP>:8081.
 * Supabase Auth rejects non-loopback IP hostnames before checking the
 * redirect allowlist (falls back to site_url). preferLocalhost →
 * exp://localhost:8081 which is allowlisted via exp://** and works with
 * openAuthSessionAsync on device.
 */
export function getOAuthRedirectTo() {
  const redirectTo = makeRedirectUri({ preferLocalhost: true });
  console.log('[auth] redirectTo', redirectTo);
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

  // Confirm Supabase kept our redirect_to (not site_url fallback).
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
