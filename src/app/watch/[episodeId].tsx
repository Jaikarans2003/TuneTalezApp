import { router, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'

import { EpisodePlayer, usePreloadPlaybackUrls } from '@/components/player/EpisodePlayer'
import { UnlockSheet } from '@/components/player/UnlockSheet'
import { colors } from '@/constants/colors'
import { issuePlayback, refreshPlayback, type PlaybackSession } from '@/lib/playback'
import { watchEpisodeHref } from '@/lib/routes'
import { supabase } from '@/lib/supabase'
import { upsertWatchProgress } from '@/lib/watchHistory'
import { useAuth } from '@/providers/AuthProvider'
import type { Database } from '@/types/database'

type Episode = Database['public']['Tables']['episodes']['Row']
type Series = Database['public']['Tables']['series']['Row']

const PROGRESS_INTERVAL_MS = 5000
const UP_NEXT_SECONDS = 5

export default function WatchScreen() {
  const { episodeId } = useLocalSearchParams<{ episodeId: string }>()
  const { user } = useAuth()

  const [episode, setEpisode] = useState<Episode | null>(null)
  const [series, setSeries] = useState<Series | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [session, setSession] = useState<PlaybackSession | null>(null)
  const [startPosition, setStartPosition] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const [unlockOpen, setUnlockOpen] = useState(false)
  const [episodesOpen, setEpisodesOpen] = useState(false)
  const [upNext, setUpNext] = useState<number | null>(null)

  const progressRef = useRef(0)
  const currentId = episode?.id ?? episodeId

  const currentIndex = useMemo(
    () => episodes.findIndex((e) => e.id === currentId),
    [episodes, currentId],
  )
  const nextEpisode = currentIndex >= 0 ? episodes[currentIndex + 1] : undefined
  const prevEpisode = currentIndex > 0 ? episodes[currentIndex - 1] : undefined

  useEffect(() => {
    if (!episodeId) return
    let mounted = true
    void (async () => {
      const { data: ep, error: epError } = await supabase
        .from('episodes')
        .select('*')
        .eq('id', episodeId)
        .maybeSingle()

      if (!mounted) return
      if (epError || !ep) {
        setError(epError?.message ?? 'Episode not found')
        setLoading(false)
        return
      }

      setEpisode(ep)
      setError(null)
      setSession(null)

      if (!ep.is_free) {
        setUnlockOpen(true)
        setLoading(false)
        return
      }

      const [{ data: seriesRow }, { data: episodeRows }] = await Promise.all([
        supabase.from('series').select('*').eq('id', ep.series_id).maybeSingle(),
        supabase
          .from('episodes')
          .select('*')
          .eq('series_id', ep.series_id)
          .order('episode_number', { ascending: true }),
      ])

      if (!mounted) return
      setSeries(seriesRow ?? null)
      setEpisodes(episodeRows ?? [])

      let resumeAt = 0
      if (user) {
        const { data: hist } = await supabase
          .from('watch_history')
          .select('progress_seconds')
          .eq('user_id', user.id)
          .eq('episode_id', episodeId)
          .maybeSingle()
        if (!mounted) return
        resumeAt = hist?.progress_seconds ?? 0
      }
      setStartPosition(resumeAt)

      try {
        const playback = await issuePlayback(episodeId)
        if (!mounted) return
        setSession(playback)
      } catch (e) {
        if (!mounted) return
        setError(e instanceof Error ? e.message : 'Could not start playback')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [episodeId, user])

  const saveProgress = useCallback(async () => {
    if (!user || !currentId) return
    await upsertWatchProgress(currentId, progressRef.current)
  }, [user, currentId])

  useEffect(() => {
    if (!user || !currentId || !session) return
    const timer = setInterval(() => {
      void saveProgress()
    }, PROGRESS_INTERVAL_MS)
    return () => {
      clearInterval(timer)
      void saveProgress()
    }
  }, [user, currentId, session, saveProgress])

  const refreshTokens = useCallback(async () => {
    if (!currentId) return
    try {
      const next = await refreshPlayback(currentId)
      setSession(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Playback token refresh failed')
    }
  }, [currentId])

  const goToEpisode = useCallback(
    (id: string) => {
      setUpNext(null)
      setEpisodesOpen(false)
      router.replace(watchEpisodeHref(id))
    },
    [],
  )

  const pan = Gesture.Pan().onEnd((e) => {
    if (e.translationY < -80 && nextEpisode) {
      goToEpisode(nextEpisode.id)
    } else if (e.translationY > 80 && prevEpisode) {
      goToEpisode(prevEpisode.id)
    }
  })

  usePreloadPlaybackUrls([])

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.text} />
      </View>
    )
  }

  if (error && !session) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Go back</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.container}>
        {session ? (
          <EpisodePlayer
            key={session.hlsUrl}
            session={session}
            startPosition={startPosition}
            paused={paused}
            onTogglePause={() => setPaused((p) => !p)}
            onProgress={(s) => {
              progressRef.current = s
            }}
            onEnded={() => {
              if (nextEpisode) setUpNext(UP_NEXT_SECONDS)
            }}
            onError={() => void refreshTokens()}
          />
        ) : null}

        <View style={styles.chrome} pointerEvents="box-none">
          <Pressable style={styles.chromeBtn} onPress={() => router.back()}>
            <Text style={styles.chromeText}>←</Text>
          </Pressable>
          <View style={styles.chromeRight}>
            <Pressable style={styles.chromeBtn} onPress={() => setEpisodesOpen(true)}>
              <Text style={styles.chromeText}>Episodes</Text>
            </Pressable>
          </View>
        </View>

        {series && episode ? (
          <View style={styles.meta} pointerEvents="none">
            <Text style={styles.metaTitle}>{series.title}</Text>
            <Text style={styles.metaSub}>
              EP {episode.episode_number} · {episode.title}
            </Text>
          </View>
        ) : null}

        {upNext !== null && nextEpisode ? (
          <UpNextBanner
            seconds={upNext}
            onTick={setUpNext}
            onPlay={() => goToEpisode(nextEpisode.id)}
            onCancel={() => setUpNext(null)}
          />
        ) : null}

        <UnlockSheet
          visible={unlockOpen}
          episodeTitle={episode?.title}
          onClose={() => {
            setUnlockOpen(false)
            router.back()
          }}
        />

        <EpisodesSheet
          visible={episodesOpen}
          episodes={episodes}
          currentId={currentId}
          onClose={() => setEpisodesOpen(false)}
          onSelect={(ep) => {
            if (!ep.is_free) {
              setUnlockOpen(true)
              return
            }
            goToEpisode(ep.id)
          }}
        />
      </View>
    </GestureDetector>
  )
}

function UpNextBanner({
  seconds,
  onTick,
  onPlay,
  onCancel,
}: {
  seconds: number
  onTick: (n: number | null) => void
  onPlay: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    if (seconds <= 0) {
      onPlay()
      return
    }
    const t = setTimeout(() => onTick(seconds - 1), 1000)
    return () => clearTimeout(t)
  }, [seconds, onTick, onPlay])

  return (
    <View style={styles.upNext}>
      <Text style={styles.upNextText}>Up next in {seconds}s</Text>
      <Pressable onPress={onCancel}>
        <Text style={styles.link}>Cancel</Text>
      </Pressable>
    </View>
  )
}

function EpisodesSheet({
  visible,
  episodes,
  currentId,
  onClose,
  onSelect,
}: {
  visible: boolean
  episodes: Episode[]
  currentId?: string
  onClose: () => void
  onSelect: (ep: Episode) => void
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.sheetTitle}>Episodes</Text>
          <FlatList
            data={episodes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.sheetRow, item.id === currentId && styles.sheetRowActive]}
                onPress={() => onSelect(item)}>
                <Text style={styles.sheetRowText}>
                  {item.episode_number}. {item.title}
                </Text>
                <Text style={styles.sheetRowMeta}>{item.is_free ? 'Free' : 'Locked'}</Text>
              </Pressable>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  chrome: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 12 : 48,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chromeRight: {
    flexDirection: 'row',
    gap: 8,
  },
  chromeBtn: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  chromeText: {
    color: '#fff',
    fontWeight: '600',
  },
  meta: {
    position: 'absolute',
    bottom: 48,
    left: 16,
    right: 16,
  },
  metaTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  metaSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginTop: 4,
  },
  upNext: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  upNextText: {
    color: '#fff',
    fontWeight: '600',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '60%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sheetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetRowActive: {
    backgroundColor: colors.background,
  },
  sheetRowText: {
    color: colors.text,
    flex: 1,
  },
  sheetRowMeta: {
    color: colors.textMuted,
  },
  error: {
    color: '#B00020',
    textAlign: 'center',
  },
  link: {
    color: colors.text,
    fontWeight: '600',
  },
})
