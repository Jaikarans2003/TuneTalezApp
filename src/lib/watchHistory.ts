import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Episode = Database['public']['Tables']['episodes']['Row']
type Series = Database['public']['Tables']['series']['Row']

export type EpisodeWithSeries = Episode & { series: Series | null }

export type ContinueWatchingRow = {
  series: Series
  episode: Episode
  progress_seconds: number
  last_watched_at: string
}

export type HistoryRow = {
  id: string
  progress_seconds: number
  last_watched_at: string
  episode: EpisodeWithSeries
}

const COMPLETE_RATIO = 0.95

export async function upsertWatchProgress(episodeId: string, progressSeconds: number) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: null }

  return supabase.from('watch_history').upsert(
    {
      user_id: user.id,
      episode_id: episodeId,
      progress_seconds: Math.max(0, Math.floor(progressSeconds)),
      last_watched_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,episode_id' },
  )
}

export async function fetchContinueWatching(userId: string): Promise<ContinueWatchingRow[]> {
  const { data, error } = await supabase
    .from('watch_history')
    .select('progress_seconds, last_watched_at, episode:episodes(*, series:series(*))')
    .eq('user_id', userId)
    .order('last_watched_at', { ascending: false })

  if (error) throw new Error(error.message)

  const bySeries = new Map<string, ContinueWatchingRow>()

  for (const row of data ?? []) {
    const episode = row.episode as EpisodeWithSeries | null
    const series = episode?.series
    if (!episode || !series) continue

    const duration = episode.duration_seconds ?? 0
    const complete = duration > 0 && row.progress_seconds >= duration * COMPLETE_RATIO
    if (complete) continue

    if (!bySeries.has(series.id)) {
      bySeries.set(series.id, {
        series,
        episode,
        progress_seconds: row.progress_seconds,
        last_watched_at: row.last_watched_at,
      })
    }
  }

  return [...bySeries.values()].sort(
    (a, b) => new Date(b.last_watched_at).getTime() - new Date(a.last_watched_at).getTime(),
  )
}

export async function fetchHistoryBySeries(userId: string): Promise<HistoryRow[]> {
  const { data, error } = await supabase
    .from('watch_history')
    .select('id, progress_seconds, last_watched_at, episode:episodes(*, series:series(*))')
    .eq('user_id', userId)
    .order('last_watched_at', { ascending: false })

  if (error) throw new Error(error.message)

  const bySeries = new Map<string, HistoryRow>()

  for (const row of data ?? []) {
    const episode = row.episode as EpisodeWithSeries | null
    if (!episode?.series) continue
    if (!bySeries.has(episode.series_id)) {
      bySeries.set(episode.series_id, {
        id: row.id,
        progress_seconds: row.progress_seconds,
        last_watched_at: row.last_watched_at,
        episode,
      })
    }
  }

  return [...bySeries.values()]
}

export async function deleteWatchHistoryEntry(id: string) {
  return supabase.from('watch_history').delete().eq('id', id)
}

export async function clearAllWatchHistory(userId: string) {
  return supabase.from('watch_history').delete().eq('user_id', userId)
}

export async function getContinueEpisodeForSeries(
  userId: string,
  _seriesId: string,
  episodes: Episode[],
): Promise<Episode | null> {
  if (episodes.length === 0) return null

  const episodeIds = episodes.map((e) => e.id)
  const { data } = await supabase
    .from('watch_history')
    .select('progress_seconds, episode_id')
    .eq('user_id', userId)
    .in('episode_id', episodeIds)
    .order('last_watched_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) {
    return episodes.find((e) => e.episode_number === 1) ?? episodes[0]
  }

  const watched = episodes.find((e) => e.id === data.episode_id)
  if (!watched) {
    return episodes.find((e) => e.episode_number === 1) ?? episodes[0]
  }

  const duration = watched.duration_seconds ?? 0
  const finished = duration > 0 && data.progress_seconds >= duration * COMPLETE_RATIO
  if (finished) {
    return episodes.find((e) => e.episode_number === watched.episode_number + 1) ?? watched
  }

  return watched
}
