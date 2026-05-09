/* Mavjud bazaga keyin qo‘llash: profil rolini klient orqali o‘zgartirishni RLS bilan bloklash.
   Yangi o‘rnatishda schema.sql allaqachon shu siyosatni o‘z ichiga oladi. */
begin;

drop policy if exists "profiles_own_update" on public.profiles;
create policy "profiles_own_update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

commit;
