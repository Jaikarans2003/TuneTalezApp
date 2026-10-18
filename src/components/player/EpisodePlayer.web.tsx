import MuxPlayer from '@mux/mux-player-react'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import type { EpisodePlayerProps } from '@/components/player/EpisodePlayer.types'

export function EpisodePlayer({ session, onEnded, onError }: EpisodePlayerProps) {
  const [muted, setMuted] = useState(true)
  const { playbackId, tokens } = session

  return (
    <View style={styles.wrap}>
      <MuxPlayer
        playbackId={playbackId}
        tokens={tokens}
        streamType="on-demand"
        muted={muted}
        autoPlay
        playsInline
        style={{ width: '100%', height: '100%' }}
        onError={() => onError?.()}
        onEnded={() => onEnded?.()}
      />
      {muted ? (
        <Pressable style={styles.unmute} onPress={() => setMuted(false)}>
          <Text style={styles.unmuteText}>Tap to unmute</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

export function usePreloadPlaybackUrls(_urls: string[]) {}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
    position: 'relative',
  },
  unmute: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    left: '25%',
    right: '25%',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  unmuteText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
})
