/* HTMLMediaElement APIs require mutating the video node — not React state. */
/* eslint-disable react-hooks/refs, import/no-named-as-default, import/no-named-as-default-member */
import Hls from 'hls.js'
import { createElement, useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import type { EpisodePlayerProps } from '@/components/player/EpisodePlayer.types'

/**
 * Web HLS: prefer hls.js (MSE) for Chrome/Firefox; native HLS only when MSE unavailable (Safari iOS).
 */
export function EpisodePlayer({ session, onEnded, onError, onProgress }: EpisodePlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const url = session.hlsUrl
    let hls: Hls | null = null

    const onTimeUpdate = () => {
      onProgress?.(video.currentTime)
    }
    const onEndedNative = () => onEnded?.()
    const onErrorNative = () => onError?.()

    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('ended', onEndedNative)
    video.addEventListener('error', onErrorNative)

    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true })
      hls.loadSource(url)
      hls.attachMedia(video)
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) onError?.()
      })
      void video.play().catch(() => {})
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url
      void video.play().catch(() => {})
    } else {
      onError?.()
    }

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('ended', onEndedNative)
      video.removeEventListener('error', onErrorNative)
      hls?.destroy()
      video.removeAttribute('src')
    }
  }, [session.hlsUrl, onEnded, onError, onProgress])

  useEffect(() => {
    const video = videoRef.current
    if (video) video.muted = muted
  }, [muted])

  return (
    <View style={styles.wrap}>
      {createElement('video', {
        ref: (el: HTMLVideoElement | null) => {
          videoRef.current = el
        },
        muted,
        autoPlay: true,
        playsInline: true,
        style: {
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          backgroundColor: '#000',
        },
      })}
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
