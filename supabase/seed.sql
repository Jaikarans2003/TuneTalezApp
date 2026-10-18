-- Phase 1 seed: 6 published series × 10 episodes each. CI never runs this file.

insert into public.series (id, title, synopsis, poster_path, sort_order, is_published) values
  ('11111111-1111-1111-1111-111111111101', 'Midnight Train', 'A late-night commute turns into a chase across the city.', 'posters/midnight-train.jpg', 1, true),
  ('11111111-1111-1111-1111-111111111102', 'Rooftop Promises', 'Two strangers meet on a monsoon rooftop and rewrite their futures.', 'posters/rooftop-promises.jpg', 2, true),
  ('11111111-1111-1111-1111-111111111103', 'Cafe at 2AM', 'The last open cafe hides a secret society of night workers.', 'posters/cafe-at-2am.jpg', 3, true),
  ('11111111-1111-1111-1111-111111111104', 'Borrowed Ring', 'A fake engagement for a family wedding becomes too real.', 'posters/borrowed-ring.jpg', 4, true),
  ('11111111-1111-1111-1111-111111111105', 'Signal Lost', 'A radio DJ gets calls from a future that has not happened yet.', 'posters/signal-lost.jpg', 5, true),
  ('11111111-1111-1111-1111-111111111106', 'Last Auto', 'The final shared auto of the night carries three unlikely allies.', 'posters/last-auto.jpg', 6, true);

insert into public.episodes (series_id, episode_number, title, duration_seconds, is_free)
select
  s.id,
  g.n,
  'Episode ' || g.n,
  90 + (g.n * 5),
  g.n <= 4
from public.series s
cross join generate_series(1, 10) as g(n)
where s.id in (
  '11111111-1111-1111-1111-111111111101',
  '11111111-1111-1111-1111-111111111102',
  '11111111-1111-1111-1111-111111111103',
  '11111111-1111-1111-1111-111111111104',
  '11111111-1111-1111-1111-111111111105',
  '11111111-1111-1111-1111-111111111106'
);
