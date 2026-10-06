create table public.officer_profiles (
  officer_id bigint primary key references public.officers(id) on delete cascade,
  birthday text,
  hobbies text,
  favorite_color text,
  favorite_song text,
  personality_type text,
  favorite_pokemon text,
  personal_motto text,
  instagram_handle text,
  photo_url text,
  has_cic_shirt boolean not null default false,
  tshirt_size text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.officer_profiles enable row level security;
grant select on table public.officer_profiles to authenticated;

create function private.current_is_executive() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.officers o
    join public.positions p on p.id = o.position_id
    where o.id = private.current_active_officer_id() and p.name in ('President', 'Vice President of Operations', 'Vice President of Academics'))
$$;
revoke all on function private.current_is_executive() from public, anon, authenticated;
grant execute on function private.current_is_executive() to authenticated;

grant execute on function private.current_is_lead() to authenticated;

create policy "Leads, executives, and admins read profiles" on public.officer_profiles
  for select to authenticated using (
    (select private.current_is_admin()) or 
    (select private.current_is_lead()) or 
    (select private.current_is_executive()) or 
    officer_id = (select private.current_active_officer_id())
  );

create function private.save_officer_profile(
  p_officer_id bigint,
  p_birthday text,
  p_hobbies text,
  p_favorite_color text,
  p_favorite_song text,
  p_personality_type text,
  p_favorite_pokemon text,
  p_personal_motto text,
  p_instagram_handle text,
  p_photo_url text,
  p_has_cic_shirt boolean,
  p_tshirt_size text
) returns void language plpgsql security definer set search_path = '' as $$
declare
  actor_id bigint := private.current_active_officer_id();
begin
  if actor_id is null then raise exception 'Unauthorized'; end if;
  if p_officer_id is distinct from actor_id and not private.current_is_admin() then
    raise exception 'Cannot manage another officer''s profile unless admin';
  end if;

  insert into public.officer_profiles (
    officer_id, birthday, hobbies, favorite_color, favorite_song,
    personality_type, favorite_pokemon, personal_motto, instagram_handle,
    photo_url, has_cic_shirt, tshirt_size, updated_at
  ) values (
    p_officer_id, nullif(trim(p_birthday),''), nullif(trim(p_hobbies),''),
    nullif(trim(p_favorite_color),''), nullif(trim(p_favorite_song),''),
    nullif(trim(p_personality_type),''), nullif(trim(p_favorite_pokemon),''),
    nullif(trim(p_personal_motto),''), nullif(trim(p_instagram_handle),''),
    nullif(trim(p_photo_url),''), coalesce(p_has_cic_shirt, false), nullif(trim(p_tshirt_size),''), now()
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
    updated_at = now();
end;
$$;
revoke all on function private.save_officer_profile(bigint, text, text, text, text, text, text, text, text, text, boolean, text) from public, anon, authenticated;
grant execute on function private.save_officer_profile(bigint, text, text, text, text, text, text, text, text, text, boolean, text) to authenticated;

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
  p_has_cic_shirt boolean default false,
  p_tshirt_size text default null
) returns void language sql security invoker set search_path = '' as $$
  select private.save_officer_profile(
    p_officer_id, p_birthday, p_hobbies, p_favorite_color, p_favorite_song,
    p_personality_type, p_favorite_pokemon, p_personal_motto, p_instagram_handle,
    p_photo_url, p_has_cic_shirt, p_tshirt_size
  )
$$;
revoke all on function public.save_officer_profile(bigint, text, text, text, text, text, text, text, text, text, boolean, text) from public, anon, authenticated;
grant execute on function public.save_officer_profile(bigint, text, text, text, text, text, text, text, text, text, boolean, text) to authenticated;
