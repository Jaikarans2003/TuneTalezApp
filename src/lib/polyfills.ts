import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { CryptoDigestAlgorithm, digest } from 'expo-crypto';

/**
 * Supabase PKCE needs crypto.subtle.digest (SHA-256). Expo Go has
 * getRandomValues but not subtle. Must run before @supabase/supabase-js loads.
 */
const subtle = {
  digest(algorithm: AlgorithmIdentifier, data: BufferSource) {
    const name = typeof algorithm === 'string' ? algorithm : algorithm.name;
    return digest(name as CryptoDigestAlgorithm, data);
  },
};

try {
  const g = globalThis as typeof globalThis & {
    crypto?: Crypto & { subtle?: SubtleCrypto };
  };

  if (typeof g.crypto === 'undefined') {
    Object.defineProperty(g, 'crypto', {
      configurable: true,
      enumerable: true,
      value: { subtle },
    });
  } else if (typeof g.crypto.subtle === 'undefined') {
    try {
      Object.defineProperty(g.crypto, 'subtle', {
        configurable: true,
        enumerable: true,
        value: subtle,
      });
    } catch {
      // Some runtimes seal crypto; mutate directly as last resort.
      (g.crypto as { subtle: typeof subtle }).subtle = subtle;
    }
  }
} catch (e) {
  console.warn('[polyfills] crypto.subtle install failed', e);
}
