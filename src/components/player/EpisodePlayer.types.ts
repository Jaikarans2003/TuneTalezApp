import type { PlaybackSession } from '@/lib/playback'

export type EpisodePlayerProps = {
  session: PlaybackSession
  startPosition?: number
  paused?: boolean
  onTogglePause?: () => void
  onProgress?: (seconds: number) => void
  onEnded?: () => void
  onError?: () => void
}
