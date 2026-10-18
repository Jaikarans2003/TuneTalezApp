import { withSupabase } from 'npm:@supabase/server@1'
import * as jose from 'npm:jose@5'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/** Cloudflare Stream signed token — RS256; header kid; claims sub/kid/exp (≤1h). */
async function mintStreamToken(
  videoUid: string,
  keyId: string,
  jwkBase64: string,
): Promise<string> {
  const jwk = JSON.parse(atob(jwkBase64)) as jose.JWK
  const key = await jose.importJWK(jwk, 'RS256')
  const exp = Math.floor(Date.now() / 1000) + 3600
  return new jose.SignJWT({ kid: keyId, exp })
    .setProtectedHeader({ alg: 'RS256', kid: keyId })
    .setSubject(videoUid)
    .sign(key)
}

export default {
  fetch: withSupabase({ auth: ['user', 'publishable'] }, async (req, ctx) => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }
    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405)
    }

    let body: { episode_id?: string }
    try {
      body = await req.json()
    } catch {
      return json({ error: 'Invalid JSON body' }, 400)
    }

    const episodeId = body.episode_id?.trim()
    if (!episodeId) {
      return json({ error: 'episode_id is required' }, 400)
    }

    const { data: episode, error: loadError } = await ctx.supabase
      .from('episodes')
      .select('is_free, video_id')
      .eq('id', episodeId)
      .maybeSingle()

    if (loadError) {
      return json({ error: loadError.message }, 500)
    }
    if (!episode) {
      return json({ error: 'Episode not found' }, 404)
    }
    if (!episode.is_free) {
      return json({ error: 'Episode is locked' }, 403)
    }
    if (!episode.video_id) {
      return json({ error: 'Playback not configured for this episode' }, 404)
    }

    const keyId = Deno.env.get('STREAM_SIGNING_KEY_ID')
    const jwkB64 = Deno.env.get('STREAM_SIGNING_JWK')
    const customerCode = Deno.env.get('STREAM_CUSTOMER_CODE')
    if (!keyId || !jwkB64 || !customerCode) {
      return json({ error: 'Stream signing is not configured' }, 503)
    }

    try {
      const token = await mintStreamToken(episode.video_id, keyId, jwkB64)
      const hlsUrl = `https://customer-${customerCode}.cloudflarestream.com/${token}/manifest/video.m3u8`
      return json({ hlsUrl })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to mint playback token'
      return json({ error: message }, 500)
    }
  }),
}
