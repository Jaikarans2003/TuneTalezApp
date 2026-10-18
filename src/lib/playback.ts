import { supabase } from '@/lib/supabase'

export type PlaybackTokens = {
  playback: string
  thumbnail: string
  storyboard: string
}

export type PlaybackSession = {
  playbackId: string
  tokens: PlaybackTokens
  playbackUrl: string
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
  const tokens = v.tokens
  if (!tokens || typeof tokens !== 'object') return false
  const t = tokens as Record<string, unknown>
  return (
    typeof v.playbackId === 'string' &&
    typeof v.playbackUrl === 'string' &&
    typeof t.playback === 'string' &&
    typeof t.thumbnail === 'string' &&
    typeof t.storyboard === 'string'
  )
}

export async function issuePlayback(episodeId: string): Promise<PlaybackSession> {
  const { data, error } = await supabase.functions.invoke('issue-playback', {
    body: { episode_id: episodeId } satisfies IssuePlaybackBody,
  })

  if (error) {
    throw new Error(error.message)
  }

  if (data && typeof data === 'object' && 'error' in data && typeof (data as IssuePlaybackError).error === 'string') {
    throw new Error((data as IssuePlaybackError).error)
  }

  if (!isPlaybackSession(data)) {
    throw new Error('Invalid playback response')
  }

  return data
}

/** Re-fetch all three Mux JWTs after expiry or player error. */
export async function refreshPlaybackTokens(episodeId: string): Promise<PlaybackSession> {
  return issuePlayback(episodeId)
}
