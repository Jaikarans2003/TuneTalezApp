import type { Href } from 'expo-router'

/** Typed-route safe link until Expo regenerates routes after adding watch screen. */
export function watchEpisodeHref(episodeId: string): Href {
  return `/watch/${episodeId}` as Href
}
