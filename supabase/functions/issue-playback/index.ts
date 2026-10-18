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

async function mintMuxJwt(
  playbackId: string,
  aud: string,
  keyId: string,
  privateKeyPem: string,
): Promise<string> {
  const key = await jose.importPKCS8(privateKeyPem, 'RS256')
  return new jose.SignJWT({})
    .setProtectedHeader({ alg: 'RS256', kid: keyId })
    .setSubject(playbackId)
    .setAudience(aud)
    .setExpirationTime('1h')
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
      .select('is_free, mux_playback_id')
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
    if (!episode.mux_playback_id) {
      return json({ error: 'Playback not configured for this episode' }, 404)
    }

    const keyId = Deno.env.get('MUX_SIGNING_KEY_ID')
    const privateKeyB64 = Deno.env.get('MUX_SIGNING_PRIVATE_KEY')
    if (!keyId || !privateKeyB64) {
      return json({ error: 'Mux signing is not configured' }, 503)
    }

    let privateKeyPem: string
    try {
      privateKeyPem = atob(privateKeyB64)
    } catch {
      return json({ error: 'Invalid MUX_SIGNING_PRIVATE_KEY' }, 503)
    }

    const playbackId = episode.mux_playback_id

    try {
      const [playback, thumbnail, storyboard] = await Promise.all([
        mintMuxJwt(playbackId, 'v', keyId, privateKeyPem),
        mintMuxJwt(playbackId, 't', keyId, privateKeyPem),
        mintMuxJwt(playbackId, 's', keyId, privateKeyPem),
      ])

      const playbackUrl = `https://stream.mux.com/${playbackId}.m3u8?token=${playback}`

      return json({
        playbackId,
        tokens: { playback, thumbnail, storyboard },
        playbackUrl,
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to mint playback token'
      return json({ error: message }, 500)
    }
  }),
}
