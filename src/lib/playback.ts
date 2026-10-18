import { supabase } from '@/lib/supabase'

/** Provider-agnostic session — client only needs a signed HLS URL. */
export type PlaybackSession = {
  hlsUrl: string
}

type IssuePlaybackBody = {
  episode_id: string
}

type IssuePlaybackError = {
  error: string
}

function isPlaybackSession(value: unknown): value is PlaybackSession {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return typeof v.hlsUrl === 'string' && v.hlsUrl.length > 0
}

export async function issuePlayback(episodeId: string): Promise<PlaybackSession> {
  const { data, error } = await supabase.functions.invoke('issue-playback', {
    body: { episode_id: episodeId } satisfies IssuePlaybackBody,
  })

  if (error) {
    throw new Error(error.message)
  }

  if (
    data &&
    typeof data === 'object' &&
    'error' in data &&
    typeof (data as IssuePlaybackError).error === 'string'
  ) {
    throw new Error((data as IssuePlaybackError).error)
  }

  if (!isPlaybackSession(data)) {
    throw new Error('Invalid playback response')
  }

  return data
}

/** Re-fetch a signed HLS URL after token expiry or player error. */
export async function refreshPlayback(episodeId: string): Promise<PlaybackSession> {
  return issuePlayback(episodeId)
}

/** @deprecated use refreshPlayback */
export const refreshPlaybackTokens = refreshPlayback
