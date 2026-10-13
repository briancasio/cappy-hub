create table public.officer_profiles (
  officer_id bigint primary key references public.officers(id) on delete restrict,
  birthday varchar(100),
  hobbies varchar(1000),
  favorite_color varchar(100),
  favorite_song varchar(200),
  personality_type varchar(32),
  favorite_pokemon varchar(100),
  personal_motto varchar(500),
  instagram_handle varchar(64),
  photo_url varchar(2048),
  has_cic_shirt boolean,
  tshirt_size varchar(32),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint officer_profiles_photo_url_check check (
    photo_url is null or (
      photo_url ~ '^https?://[^[:space:]]+$' and
      photo_url !~ '^https?://[^/@]*@'
    )
  )
);

alter table public.officer_profiles enable row level security;
grant select on table public.officer_profiles to authenticated;

create policy "Active officers read profiles" on public.officer_profiles
  for select to authenticated using (
    (select private.current_active_officer_id()) is not null
  );

create function public.save_officer_profile(
  p_officer_id bigint,
  p_birthday text default null,
  p_hobbies text default null,
  p_favorite_color text default null,
  p_favorite_song text default null,
  p_personality_type text default null,
  p_favorite_pokemon text default null,
  p_personal_motto text default null,
  p_instagram_handle text default null,
  p_photo_url text default null,
  p_has_cic_shirt boolean default null,
  p_tshirt_size text default null
) returns void language plpgsql security definer set search_path = '' as $$
declare
  actor_id bigint := private.current_active_officer_id();
  previous public.officer_profiles;
  next_profile public.officer_profiles;
  changed_fields text[];
begin
  if actor_id is null then raise exception 'Unauthorized'; end if;
  if p_officer_id is distinct from actor_id and not private.current_is_admin() then
    raise exception 'Cannot manage another officer''s profile unless admin';
  end if;

  select * into previous from public.officer_profiles
  where officer_id = p_officer_id for update;

  insert into public.officer_profiles (
    officer_id, birthday, hobbies, favorite_color, favorite_song,
    personality_type, favorite_pokemon, personal_motto, instagram_handle,
    photo_url, has_cic_shirt, tshirt_size, updated_at
  ) values (
    p_officer_id, nullif(pg_catalog.btrim(p_birthday),''),
    nullif(pg_catalog.btrim(p_hobbies),''), nullif(pg_catalog.btrim(p_favorite_color),''),
    nullif(pg_catalog.btrim(p_favorite_song),''), nullif(pg_catalog.btrim(p_personality_type),''),
    nullif(pg_catalog.btrim(p_favorite_pokemon),''), nullif(pg_catalog.btrim(p_personal_motto),''),
    nullif(pg_catalog.btrim(p_instagram_handle),''), nullif(pg_catalog.btrim(p_photo_url),''),
    p_has_cic_shirt, nullif(pg_catalog.btrim(p_tshirt_size),''), now()
  )
  on conflict (officer_id) do update set
    birthday = excluded.birthday,
    hobbies = excluded.hobbies,
    favorite_color = excluded.favorite_color,
    favorite_song = excluded.favorite_song,
    personality_type = excluded.personality_type,
    favorite_pokemon = excluded.favorite_pokemon,
    personal_motto = excluded.personal_motto,
    instagram_handle = excluded.instagram_handle,
    photo_url = excluded.photo_url,
    has_cic_shirt = excluded.has_cic_shirt,
    tshirt_size = excluded.tshirt_size,
    updated_at = now()
  returning * into next_profile;

  select pg_catalog.array_agg(field_name order by field_name) into changed_fields
  from pg_catalog.unnest(array[
    'birthday','hobbies','favorite_color','favorite_song','personality_type',
    'favorite_pokemon','personal_motto','instagram_handle','photo_url',
    'has_cic_shirt','tshirt_size'
  ]) as field_name
  where to_jsonb(previous) -> field_name is distinct from to_jsonb(next_profile) -> field_name;

  if changed_fields is not null then
    perform private.write_audit_log(
      'officer.profile_updated', 'officer', p_officer_id::text,
      pg_catalog.jsonb_build_object('target_officer_id',p_officer_id,
        'changed_fields',changed_fields)
    );
  end if;
end;
$$;

revoke all on function public.save_officer_profile(bigint, text, text, text, text, text, text, text, text, text, boolean, text)
  from public, anon, authenticated;
grant execute on function public.save_officer_profile(bigint, text, text, text, text, text, text, text, text, text, boolean, text)
  to authenticated;
