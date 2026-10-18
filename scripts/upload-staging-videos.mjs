#!/usr/bin/env node
/**
 * One-time staging helper: create ≤10 Mux assets (signed, video_quality basic) and
 * write mux_playback_id + duration_seconds onto staging episodes.
 *
 * Env (never commit values):
 *   MUX_TOKEN_ID, MUX_TOKEN_SECRET — Mux API access token
 *   EXPO_PUBLIC_SUPABASE_URL or SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY — service role (bypasses RLS)
 *
 * Optional:
 *   MUX_INPUT_URL — MP4 URL (default: Mux demo vertical clip)
 *   MUX_MAX_ASSETS — default 6 (one playback id per seed series)
 *
 * Usage:
 *   node scripts/upload-staging-videos.mjs
 *
 * Staging Free plan allows ≤10 assets total; script aborts if MUX_MAX_ASSETS > 10.
 */

import { createClient } from '@supabase/supabase-js'

const MUX_API = 'https://api.mux.com/video/v1'
const DEFAULT_INPUT =
  process.env.MUX_INPUT_URL ??
  'https://storage.googleapis.com/muxdemofiles/mux-video-intro.mp4'

const SERIES_IDS = [
  '11111111-1111-1111-1111-111111111101',
  '11111111-1111-1111-1111-111111111102',
  '11111111-1111-1111-1111-111111111103',
  '11111111-1111-1111-1111-111111111104',
  '11111111-1111-1111-1111-111111111105',
  '11111111-1111-1111-1111-111111111106',
]

function requireEnv(name) {
  const v = process.env[name]
  if (!v) {
    console.error(`Missing env: ${name}`)
    process.exit(1)
  }
  return v
}

function muxAuthHeader() {
  const id = requireEnv('MUX_TOKEN_ID')
  const secret = requireEnv('MUX_TOKEN_SECRET')
  const token = Buffer.from(`${id}:${secret}`).toString('base64')
  return `Basic ${token}`
}

async function muxFetch(path, init = {}) {
  const res = await fetch(`${MUX_API}${path}`, {
    ...init,
    headers: {
      Authorization: muxAuthHeader(),
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json?.error?.messages?.join(', ') ?? json?.errors?.[0]?.message ?? res.statusText)
  }
  return json
}

async function createSignedAsset(inputUrl) {
  const body = {
    input: [{ url: inputUrl }],
    playback_policies: ['signed'],
    video_quality: 'basic',
  }
  const { data } = await muxFetch('/assets', { method: 'POST', body: JSON.stringify(body) })
  return data
}

async function waitForAssetReady(assetId, { timeoutMs = 600_000, intervalMs = 5_000 } = {}) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const { data } = await muxFetch(`/assets/${assetId}`)
    if (data.status === 'ready') return data
    if (data.status === 'errored') {
      throw new Error(`Mux asset ${assetId} errored: ${JSON.stringify(data.errors)}`)
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error(`Timed out waiting for Mux asset ${assetId}`)
}

function playbackIdFromAsset(asset) {
  const signed = asset.playback_ids?.find((p) => p.policy === 'signed')
  return signed?.id ?? asset.playback_ids?.[0]?.id ?? null
}

async function main() {
  const maxAssets = Math.min(Number(process.env.MUX_MAX_ASSETS ?? SERIES_IDS.length), 10)
  if (maxAssets > 10) {
    console.error('Mux Free staging allows at most 10 assets.')
    process.exit(1)
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  if (!supabaseUrl) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_URL')
    process.exit(1)
  }
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const supabase = createClient(supabaseUrl, serviceKey)

  const seriesToUpdate = SERIES_IDS.slice(0, maxAssets)
  console.log(`Creating ${seriesToUpdate.length} Mux asset(s)…`)

  for (const seriesId of seriesToUpdate) {
    console.log(`\nSeries ${seriesId}`)
    const created = await createSignedAsset(DEFAULT_INPUT)
    const assetId = created.id
    console.log(`  asset ${assetId} — waiting for ready…`)
    const ready = await waitForAssetReady(assetId)
    const playbackId = playbackIdFromAsset(ready)
    if (!playbackId) {
      throw new Error(`No playback id on asset ${assetId}`)
    }
    const durationSeconds = Math.round(ready.duration ?? 0) || null
    console.log(`  playback_id=${playbackId} duration=${durationSeconds ?? 'unknown'}`)

    const { error } = await supabase
      .from('episodes')
      .update({
        mux_playback_id: playbackId,
        ...(durationSeconds ? { duration_seconds: durationSeconds } : {}),
      })
      .eq('series_id', seriesId)

    if (error) throw new Error(error.message)
    console.log('  updated all episodes in series')
  }

  console.log('\nDone.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
