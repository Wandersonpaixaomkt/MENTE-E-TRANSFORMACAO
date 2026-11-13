-- Mente & Transformação: usuários, permissões e autoria da anamnese.
-- Esta migração é preparada localmente. Não a aplique em produção sem revisar
-- os acessos existentes e confirmar uma janela de atualização.

alter table public.perfis
  add column if not exists ativo boolean not null default true,
  add column if not exists permissoes jsonb not null default '{"criar_anamnese": true, "registrar_evolucao": true, "gerenciar_agenda": true}'::jsonb;

alter table public.pacientes
  add column if not exists criado_por uuid references auth.users (id) on delete set null,
  add column if not exists criado_por_usuario text not null default '';

update public.perfis
set permissoes = '{"criar_anamnese": true, "registrar_evolucao": true, "gerenciar_agenda": true}'::jsonb
where permissoes is null or permissoes = '{}'::jsonb;

update public.pacientes
set criado_por_usuario = 'Cadastro anterior'
where coalesce(criado_por_usuario, '') = '';

-- Funções de autorização. O search_path explícito evita a resolução de objetos
-- controlados por usuários em funções security definer.
create or replace function public.eh_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.perfis
    where user_id = auth.uid() and papel = 'admin' and ativo
  )
$$;

create or replace function public.esta_ativo() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.perfis where user_id = auth.uid() and ativo)
$$;

create or replace function public.meu_profissional_id() returns text
language sql stable security definer set search_path = '' as $$
  select profissional_id from public.perfis where user_id = auth.uid() and ativo
$$;

create or replace function public.tem_permissao(p_chave text) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.eh_admin() or exists (
    select 1 from public.perfis
    where user_id = auth.uid()
      and ativo
      and coalesce((permissoes ->> p_chave)::boolean, false)
  )
$$;

create or replace function public.atende_paciente(p_paciente_id text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.pacientes
    where id = p_paciente_id and public.meu_profissional_id() = any (profissionais_ids)
  )
$$;

create or replace function public.definir_autoria_paciente() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_usuario text;
begin
  if tg_op = 'INSERT' then
    select usuario into v_usuario
    from public.perfis
    where user_id = auth.uid() and ativo;

    if v_usuario is null then
      raise exception 'Apenas usuários ativos podem criar uma ficha de anamnese.';
    end if;

    new.criado_por := auth.uid();
    new.criado_por_usuario := '@' || v_usuario;
    return new;
  end if;

  if new.criado_por is distinct from old.criado_por
    or new.criado_por_usuario is distinct from old.criado_por_usuario then
    raise exception 'A autoria do cadastro não pode ser alterada.';
  end if;

  return new;
end
$$;

drop trigger if exists pacientes_definir_autoria on public.pacientes;
create trigger pacientes_definir_autoria
before insert or update on public.pacientes
for each row execute function public.definir_autoria_paciente();

revoke execute on function public.definir_autoria_paciente() from public, anon, authenticated;

create or replace function privado.email_de_acesso(p_usuario text) returns text
language sql immutable set search_path = '' as $$
  select lower(trim(regexp_replace(p_usuario, '^@+', ''))) || '@painel.mente-transformacao.invalid'
$$;

create or replace function privado.validar_acesso(p_usuario text, p_senha text, p_tamanho_minimo int) returns void
language plpgsql set search_path = '' as $$
begin
  if p_usuario !~ '^[a-z0-9._&-]{3,}$' then
    raise exception 'O usuário precisa ter 3 ou mais caracteres: letras minúsculas, números, ponto, hífen, sublinhado ou &.';
  end if;
  if p_senha is null or length(p_senha) < p_tamanho_minimo then
    raise exception 'A senha precisa ter pelo menos % caracteres.', p_tamanho_minimo;
  end if;
end
$$;

create or replace function public.criar_primeiro_admin(p_usuario text, p_senha text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_usuario text := lower(trim(regexp_replace(p_usuario, '^@+', '')));
begin
  perform pg_advisory_xact_lock(hashtext('mt-primeiro-admin'));
  if not public.precisa_configurar() then
    raise exception 'A administradora já foi cadastrada.';
  end if;
  perform privado.validar_acesso(v_usuario, p_senha, 8);
  v_id := privado.criar_usuario(v_usuario, p_senha);
  insert into public.perfis (user_id, usuario, papel, ativo, permissoes)
  values (v_id, v_usuario, 'admin', true, '{"criar_anamnese": true, "registrar_evolucao": true, "gerenciar_agenda": true}'::jsonb);
end
$$;

-- Cria ou ajusta um usuário sem revelar senhas já existentes. A senha é
-- recebida apenas quando há criação ou redefinição, e nunca é persistida em
-- public.senhas_acesso.
create or replace function public.salvar_usuario(
  p_user_id uuid,
  p_usuario text,
  p_senha text default null,
  p_papel text default 'profissional',
  p_profissional_id text default null,
  p_ativo boolean default true,
  p_permissoes jsonb default '{"criar_anamnese": true, "registrar_evolucao": true, "gerenciar_agenda": true}'::jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_usuario text := lower(trim(regexp_replace(p_usuario, '^@+', '')));
  v_email text;
  v_anterior public.perfis%rowtype;
  v_permissoes jsonb;
begin
  if not public.eh_admin() then
    raise exception 'Somente a administração pode alterar acessos.';
  end if;

  if p_papel not in ('admin', 'profissional') then
    raise exception 'Tipo de acesso inválido.';
  end if;

  perform privado.validar_acesso(v_usuario, coalesce(nullif(p_senha, ''), repeat('x', 8)), 8);
  v_email := privado.email_de_acesso(v_usuario);
  v_permissoes := jsonb_build_object(
    'criar_anamnese', coalesce((p_permissoes ->> 'criar_anamnese')::boolean, true),
    'registrar_evolucao', coalesce((p_permissoes ->> 'registrar_evolucao')::boolean, true),
    'gerenciar_agenda', coalesce((p_permissoes ->> 'gerenciar_agenda')::boolean, true)
  );

  if p_papel = 'admin' then
    p_profissional_id := null;
    v_permissoes := '{"criar_anamnese": true, "registrar_evolucao": true, "gerenciar_agenda": true}'::jsonb;
  elsif p_profissional_id is null or not exists (select 1 from public.profissionais where id = p_profissional_id) then
    raise exception 'Selecione um profissional existente para este acesso.';
  end if;

  if p_user_id is not null then
    select * into v_anterior from public.perfis where user_id = p_user_id;
    if not found then
      raise exception 'Usuário não encontrado.';
    end if;
    v_id := p_user_id;
    if v_id = auth.uid() and (p_papel <> 'admin' or not p_ativo) then
      raise exception 'Você não pode remover ou desativar o seu próprio acesso administrativo.';
    end if;
    if v_anterior.papel = 'admin' and v_anterior.ativo and (p_papel <> 'admin' or not p_ativo)
      and not exists (select 1 from public.perfis where papel = 'admin' and ativo and user_id <> v_id) then
      raise exception 'Mantenha pelo menos um acesso administrativo ativo.';
    end if;
  else
    if p_senha is null or length(p_senha) < 8 then
      raise exception 'Informe uma senha com pelo menos 8 caracteres para o novo acesso.';
    end if;
    v_id := privado.criar_usuario(v_usuario, p_senha);
  end if;

  if exists (select 1 from public.perfis where usuario = v_usuario and user_id <> v_id) then
    raise exception 'Este usuário já está em uso.';
  end if;
  if p_profissional_id is not null and exists (select 1 from public.perfis where profissional_id = p_profissional_id and user_id <> v_id) then
    raise exception 'Este profissional já possui um acesso.';
  end if;

  if p_user_id is null then
    insert into public.perfis (user_id, usuario, papel, profissional_id, ativo, permissoes)
    values (v_id, v_usuario, p_papel, p_profissional_id, p_ativo, v_permissoes);
  else
    update auth.users
    set email = v_email,
        encrypted_password = case when nullif(p_senha, '') is null then encrypted_password else extensions.crypt(p_senha, extensions.gen_salt('bf')) end,
        updated_at = now()
    where id = v_id;
    update auth.identities
    set identity_data = identity_data || jsonb_build_object('email', v_email), updated_at = now()
    where user_id = v_id and provider = 'email';
    update public.perfis
    set usuario = v_usuario, papel = p_papel, profissional_id = p_profissional_id, ativo = p_ativo, permissoes = v_permissoes
    where user_id = v_id;
  end if;

  return v_id;
end
$$;

-- Compatibilidade para instalações que ainda chamam a função anterior.
create or replace function public.salvar_acesso(p_profissional_id text, p_usuario text, p_senha text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.salvar_usuario(
    (select user_id from public.perfis where profissional_id = p_profissional_id),
    p_usuario, p_senha, 'profissional', p_profissional_id, true,
    '{"criar_anamnese": true, "registrar_evolucao": true, "gerenciar_agenda": true}'::jsonb
  );
end
$$;

-- A tabela antiga é mantida somente para não causar remoção automática de dados
-- em uma atualização. Nenhum cliente pode mais consultá-la, e novas senhas não
-- são gravadas nela. A remoção definitiva deve ocorrer após validação de backup.
drop policy if exists "só admin vê senhas" on public.senhas_acesso;
revoke select on public.senhas_acesso from authenticated;

-- RLS: as permissões da tela também são exigidas pelo banco.
drop policy if exists "equipe visível para quem entra" on public.profissionais;
drop policy if exists "admin gerencia equipe" on public.profissionais;
drop policy if exists "vê o próprio perfil ou admin vê todos" on public.perfis;
drop policy if exists "admin gerencia pacientes" on public.pacientes;
drop policy if exists "profissional vê pacientes encaminhados" on public.pacientes;
drop policy if exists "admin gerencia evoluções" on public.evolucoes;
drop policy if exists "profissional lê evoluções dos seus pacientes" on public.evolucoes;
drop policy if exists "profissional grava a própria evolução" on public.evolucoes;
drop policy if exists "profissional atualiza a própria evolução" on public.evolucoes;
drop policy if exists "admin gerencia sessões" on public.sessoes;
drop policy if exists "profissional lê sessões dos seus pacientes" on public.sessoes;
drop policy if exists "profissional agenda as próprias sessões" on public.sessoes;
drop policy if exists "admin vê indisponibilidades" on public.indisponibilidades;
drop policy if exists "profissional gerencia a própria indisponibilidade" on public.indisponibilidades;

create policy "equipe visível para usuários ativos" on public.profissionais for select to authenticated using (public.esta_ativo());
create policy "admin gerencia equipe" on public.profissionais for all to authenticated using (public.eh_admin()) with check (public.eh_admin());
create policy "perfil próprio ou perfis administrativos" on public.perfis for select to authenticated using (user_id = auth.uid() or public.eh_admin());

create policy "admin gerencia pacientes" on public.pacientes for all to authenticated using (public.eh_admin()) with check (public.eh_admin());
create policy "usuário com permissão cria anamnese" on public.pacientes for insert to authenticated with check (public.tem_permissao('criar_anamnese'));
create policy "profissional vê casos encaminhados ou criados" on public.pacientes for select to authenticated using (public.meu_profissional_id() = any (profissionais_ids) or criado_por = auth.uid());

create policy "admin gerencia evoluções" on public.evolucoes for all to authenticated using (public.eh_admin()) with check (public.eh_admin());
create policy "profissional lê evoluções dos seus pacientes" on public.evolucoes for select to authenticated using (public.atende_paciente(paciente_id));
create policy "profissional grava a própria evolução" on public.evolucoes for insert to authenticated with check (public.tem_permissao('registrar_evolucao') and profissional_id = public.meu_profissional_id() and public.atende_paciente(paciente_id));
create policy "profissional atualiza a própria evolução" on public.evolucoes for update to authenticated using (public.tem_permissao('registrar_evolucao') and profissional_id = public.meu_profissional_id()) with check (public.tem_permissao('registrar_evolucao') and profissional_id = public.meu_profissional_id() and public.atende_paciente(paciente_id));

create policy "admin gerencia sessões" on public.sessoes for all to authenticated using (public.eh_admin()) with check (public.eh_admin());
create policy "profissional lê sessões dos seus pacientes" on public.sessoes for select to authenticated using (public.atende_paciente(paciente_id));
create policy "profissional agenda as próprias sessões" on public.sessoes for insert to authenticated with check (public.tem_permissao('gerenciar_agenda') and profissional_id = public.meu_profissional_id() and public.atende_paciente(paciente_id));

create policy "admin vê indisponibilidades" on public.indisponibilidades for select to authenticated using (public.eh_admin());
create policy "profissional gerencia a própria indisponibilidade" on public.indisponibilidades for all to authenticated using (public.tem_permissao('gerenciar_agenda') and profissional_id = public.meu_profissional_id()) with check (public.tem_permissao('gerenciar_agenda') and profissional_id = public.meu_profissional_id());

revoke execute on function public.eh_admin(), public.esta_ativo(), public.meu_profissional_id(), public.tem_permissao(text), public.atende_paciente(text),
  public.precisa_configurar(), public.criar_primeiro_admin(text, text), public.salvar_acesso(text, text, text),
  public.salvar_usuario(uuid, text, text, text, text, boolean, jsonb), public.remover_profissional(text)
from public, anon, authenticated;

grant execute on function public.eh_admin(), public.esta_ativo(), public.meu_profissional_id(), public.tem_permissao(text), public.atende_paciente(text),
  public.salvar_acesso(text, text, text), public.salvar_usuario(uuid, text, text, text, text, boolean, jsonb), public.remover_profissional(text)
to authenticated;
grant execute on function public.precisa_configurar(), public.criar_primeiro_admin(text, text) to anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
