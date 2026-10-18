-- Phase 2: Mux playback id on episodes + watch_history delete for History UI

alter table public.episodes
  add column if not exists mux_playback_id text;

create policy "watch_history_delete_own"
  on public.watch_history for delete to authenticated
  using ((select auth.uid()) = user_id);

grant delete on table public.watch_history to authenticated;
