#!/usr/bin/env node
/**
 * Staging helper: copy ≤6 sample videos into Cloudflare Stream (requireSignedURLs)
 * with meta.product=tunetalez, then write video_id + duration_seconds on episodes.
 *
 * Env (never commit values):
 *   CLOUDFLARE_API_TOKEN — needs Stream:Edit on the Azonova account
 *   CLOUDFLARE_ACCOUNT_ID
 *   EXPO_PUBLIC_SUPABASE_URL or SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional:
 *   STREAM_INPUT_URL — MP4 URL to copy (default: short public sample)
 *   STREAM_MAX_VIDEOS — default 6 (one uid reused across a series' episodes)
 *
 * Only creates/updates Stream videos tagged meta.product=tunetalez.
 * Prints STREAM_CUSTOMER_CODE (from playback.hls) for Edge secrets — not private keys.
 *
 * Usage:
 *   set -a && source .env.local && set +a && node scripts/upload-staging-videos.mjs
 */

import { createClient } from '@supabase/supabase-js'

const DEFAULT_INPUT =
  process.env.STREAM_INPUT_URL ??
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'

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

function accountId() {
  return requireEnv('CLOUDFLARE_ACCOUNT_ID')
}

function apiToken() {
  return requireEnv('CLOUDFLARE_API_TOKEN')
}

async function cfFetch(path, init = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiToken()}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  const json = await res.json().catch(() => ({}))
  if (!json.success) {
    const msg = (json.errors ?? []).map((e) => e.message).join('; ') || res.statusText
    throw new Error(msg)
  }
  return json.result
}

async function copySignedVideo(url) {
  return cfFetch('/stream/copy', {
    method: 'POST',
    body: JSON.stringify({
      url,
      meta: { product: 'tunetalez' },
      requireSignedURLs: true,
    }),
  })
}

async function waitReady(uid, { timeoutMs = 600_000, intervalMs = 5_000 } = {}) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const video = await cfFetch(`/stream/${uid}`)
    if (video.readyToStream) return video
    if (video.status?.state === 'error') {
      throw new Error(`Stream video ${uid} errored: ${video.status?.errorReasonText ?? 'unknown'}`)
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error(`Timed out waiting for Stream video ${uid}`)
}

function customerCodeFromHls(hlsUrl) {
  const m = /^https:\/\/customer-([^.]+)\.cloudflarestream\.com\//.exec(hlsUrl ?? '')
  return m?.[1] ?? null
}

async function main() {
  const maxVideos = Math.min(Number(process.env.STREAM_MAX_VIDEOS ?? SERIES_IDS.length), 10)
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  if (!supabaseUrl) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_URL')
    process.exit(1)
  }
  const supabase = createClient(supabaseUrl, requireEnv('SUPABASE_SERVICE_ROLE_KEY'))

  // Safety: refuse if token cannot list Stream
  try {
    await cfFetch('/stream?per_page=1')
  } catch (e) {
    console.error('Hard stop: Cloudflare API token cannot access Stream.')
    console.error(String(e.message ?? e))
    console.error('Add Stream:Edit to the token (and ensure Stream is subscribed), then retry.')
    process.exit(1)
  }

  const seriesToUpdate = SERIES_IDS.slice(0, maxVideos)
  console.log(`Uploading ${seriesToUpdate.length} Stream video(s) with meta.product=tunetalez…`)

  let customerCode = null

  for (const seriesId of seriesToUpdate) {
    console.log(`\nSeries ${seriesId}`)
    const created = await copySignedVideo(DEFAULT_INPUT)
    const uid = created.uid
    console.log(`  uid ${uid} — waiting for ready…`)
    const ready = await waitReady(uid)
    if (ready.meta?.product !== 'tunetalez') {
      throw new Error(`Refusing to use video ${uid}: meta.product is not tunetalez`)
    }
    const durationSeconds = Math.round(ready.duration ?? 0) || null
    const code = customerCodeFromHls(ready.playback?.hls)
    if (code) customerCode = code
    console.log(`  duration=${durationSeconds ?? 'unknown'}`)

    const { error } = await supabase
      .from('episodes')
      .update({
        video_id: uid,
        ...(durationSeconds ? { duration_seconds: durationSeconds } : {}),
      })
      .eq('series_id', seriesId)

    if (error) throw new Error(error.message)
    console.log('  updated all episodes in series')
  }

  if (customerCode) {
    console.log(`\nSet Edge secret STREAM_CUSTOMER_CODE=${customerCode}`)
  }
  console.log('Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
