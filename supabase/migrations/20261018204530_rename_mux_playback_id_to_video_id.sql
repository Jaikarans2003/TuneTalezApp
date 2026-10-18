-- Phase 2 provider-agnostic: store host video UID only (Cloudflare Stream uid today)

alter table public.episodes
  rename column mux_playback_id to video_id;
