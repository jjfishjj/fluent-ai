create or replace function public.get_talent_tutorial_funnel(
  p_start_at timestamptz,
  p_end_at timestamptz
)
returns table (
  tutorial_event text,
  tutorial_step text,
  event_count bigint,
  session_count bigint,
  player_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.has_role(auth.uid(), 'admin') then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  if p_start_at is null or p_end_at is null or p_start_at >= p_end_at then
    raise exception 'invalid date range' using errcode = '22007';
  end if;

  if p_end_at - p_start_at > interval '366 days' then
    raise exception 'date range exceeds 366 days' using errcode = '22007';
  end if;

  return query
  select
    events.properties ->> 'tutorial_event' as tutorial_event,
    events.properties ->> 'tutorial_step' as tutorial_step,
    count(*)::bigint as event_count,
    count(distinct events.session_id)::bigint as session_count,
    count(distinct events.anonymous_id)::bigint as player_count
  from public.talent_game_events events
  where events.occurred_at >= p_start_at
    and events.occurred_at < p_end_at
    and events.event_name = 'screen_viewed'
    and events.properties ->> 'screen' = 'tutorial'
    and events.properties ->> 'tutorial_event' in ('started', 'step_completed', 'misclick', 'skipped', 'completed')
  group by events.properties ->> 'tutorial_event', events.properties ->> 'tutorial_step';
end;
$$;

revoke all on function public.get_talent_tutorial_funnel(timestamptz, timestamptz) from public;
grant execute on function public.get_talent_tutorial_funnel(timestamptz, timestamptz) to authenticated;

comment on function public.get_talent_tutorial_funnel(timestamptz, timestamptz) is
  'Admin-only aggregate tutorial funnel. Returns counts only; never exposes anonymous IDs or raw event rows.';
