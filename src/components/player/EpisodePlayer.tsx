import { useVideoPlayer, VideoView } from 'expo-video'
import { useEffect, useRef } from 'react'
import { Pressable, StyleSheet } from 'react-native'

import type { EpisodePlayerProps } from '@/components/player/EpisodePlayer.types'

export type { EpisodePlayerProps } from '@/components/player/EpisodePlayer.types'

/**
 * Native HLS via expo-video. Remount with key={session.playbackUrl} when tokens refresh.
 * Player mutations stay in the useVideoPlayer setup callback (expo-video API).
 */
export function EpisodePlayer({
  session,
  startPosition = 0,
  paused = false,
  onTogglePause,
  onProgress,
  onEnded,
  onError,
}: EpisodePlayerProps) {
  const { playbackUrl } = session
  const callbacks = useRef({ onProgress, onEnded, onError, onTogglePause })
  useEffect(() => {
    callbacks.current = { onProgress, onEnded, onError, onTogglePause }
  }, [onProgress, onEnded, onError, onTogglePause])

  const player = useVideoPlayer({ uri: playbackUrl, contentType: 'hls' }, (p) => {
    p.loop = false
    p.timeUpdateEventInterval = 1
    if (startPosition > 0) p.currentTime = startPosition
    if (paused) p.pause()
    else p.play()

    p.addListener('timeUpdate', ({ currentTime }) => {
      callbacks.current.onProgress?.(currentTime)
    })
    p.addListener('statusChange', ({ status, error }) => {
      if (status === 'error' || error) callbacks.current.onError?.()
    })
    p.addListener('playToEnd', () => {
      callbacks.current.onEnded?.()
    })
  })

  return (
    <Pressable
      style={styles.fill}
      onPress={() => {
        if (player.playing) player.pause()
        else player.play()
        callbacks.current.onTogglePause?.()
      }}>
      <VideoView style={styles.fill} player={player} contentFit="cover" nativeControls={false} />
    </Pressable>
  )
}

/** Prefetch next signed HLS URLs (detached players; no VideoView). */
export function usePreloadPlaybackUrls(urls: string[]) {
  useVideoPlayer(urls[0] ? { uri: urls[0], contentType: 'hls' } : null, (p) => {
    p.pause()
  })
  useVideoPlayer(urls[1] ? { uri: urls[1], contentType: 'hls' } : null, (p) => {
    p.pause()
  })
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
  },
})
