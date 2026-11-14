-- Mente & Transformação: banco do painel clínico (Supabase / Postgres)
-- Rode uma vez no SQL Editor do projeto. Os logins usam e-mails internos
-- <usuario>@painel.mente-transformacao.invalid, que nunca recebem mensagens.

create extension if not exists pgcrypto with schema extensions;
create schema if not exists privado;

-- Mês de referência (fuso de Belém). Relatórios e histórico só aceitam registros do mês atual.
create function public.periodo_atual() returns text
language sql stable set search_path = '' as $$
  select to_char(now() at time zone 'America/Belem', 'YYYY-MM')
$$;

-- Tabelas -------------------------------------------------------------------

create table public.profissionais (
  id text primary key,
  nome text not null,
  especialidade text not null,
  registro text not null default '',
  atuacao text not null default '',
  criado_em timestamptz not null default now()
);

create table public.perfis (
  user_id uuid primary key references auth.users (id) on delete cascade,
  usuario text not null unique,
  papel text not null check (papel in ('admin', 'profissional')),
  profissional_id text unique references public.profissionais (id) on delete cascade
);

-- Senhas dos profissionais em texto, para a administradora consultar (pedido da clínica).
create table public.senhas_acesso (
  user_id uuid primary key references auth.users (id) on delete cascade,
  senha text not null
);

create table public.pacientes (
  id text primary key,
  nome text not null,
  sexo text not null default '',
  nascimento date,
  cpf text not null default '',
  responsaveis jsonb not null default '[]',
  hipotese jsonb not null default '{"has": false, "narrative": ""}',
  diagnostico jsonb not null default '{"has": false, "fileName": ""}',
  anamnese text not null default '',
  profissionais_ids text[] not null default '{}',
  status text not null default 'Aguardando encaminhamento',
  criado_em timestamptz not null default now()
);

create table public.evolucoes (
  paciente_id text references public.pacientes (id) on delete cascade,
  profissional_id text references public.profissionais (id) on delete cascade,
  queixa text not null default '',
  plano text not null default '',
  resultado text not null default '',
  atualizado_em date not null default current_date,
  periodo text not null default public.periodo_atual(),
  primary key (paciente_id, profissional_id, periodo)
);

-- Histórico descrito do paciente, mês a mês (fecha sozinho na virada do mês).
create table public.historico_mensal (
  id text primary key,
  paciente_id text not null references public.pacientes (id) on delete cascade,
  periodo text not null check (periodo ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  data date not null,
  texto text not null,
  autor text not null default '',
  criado_em timestamptz not null default now()
);
create index on public.historico_mensal (paciente_id, periodo);

create table public.sessoes (
  id text primary key,
  paciente_id text not null references public.pacientes (id) on delete cascade,
  profissional_id text not null references public.profissionais (id) on delete cascade,
  data date not null,
  horario text not null default '',
  objetivo text not null default '',
  status text not null default 'Agendada'
);

create table public.indisponibilidades (
  id text primary key,
  profissional_id text not null references public.profissionais (id) on delete cascade,
  data date not null,
  dia_todo boolean not null default true,
  inicio text not null default '',
  fim text not null default '',
  motivo text not null default ''
);

-- Quem é quem -----------------------------------------------------------------

create function public.eh_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.perfis where user_id = auth.uid() and papel = 'admin')
$$;

create function public.meu_profissional_id() returns text
language sql stable security definer set search_path = '' as $$
  select profissional_id from public.perfis where user_id = auth.uid()
$$;

create function public.atende_paciente(p_paciente_id text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.pacientes
    where id = p_paciente_id and public.meu_profissional_id() = any (profissionais_ids)
  )
$$;

-- Regras de acesso (RLS) --------------------------------------------------------

alter table public.profissionais enable row level security;
alter table public.perfis enable row level security;
alter table public.senhas_acesso enable row level security;
alter table public.pacientes enable row level security;
alter table public.evolucoes enable row level security;
alter table public.sessoes enable row level security;
alter table public.historico_mensal enable row level security;
alter table public.indisponibilidades enable row level security;

create policy "equipe visível para quem entra" on public.profissionais for select to authenticated using (true);
create policy "admin gerencia equipe" on public.profissionais for all to authenticated using (public.eh_admin()) with check (public.eh_admin());

create policy "vê o próprio perfil ou admin vê todos" on public.perfis for select to authenticated using (user_id = auth.uid() or public.eh_admin());

create policy "só admin vê senhas" on public.senhas_acesso for select to authenticated using (public.eh_admin());

create policy "admin gerencia pacientes" on public.pacientes for all to authenticated using (public.eh_admin()) with check (public.eh_admin());
create policy "profissional vê pacientes encaminhados" on public.pacientes for select to authenticated using (public.meu_profissional_id() = any (profissionais_ids));

create policy "admin lê evoluções" on public.evolucoes for select to authenticated using (public.eh_admin());
create policy "admin grava evoluções do mês aberto" on public.evolucoes for insert to authenticated with check (public.eh_admin() and periodo = public.periodo_atual());
create policy "admin altera evoluções do mês aberto" on public.evolucoes for update to authenticated using (public.eh_admin() and periodo = public.periodo_atual()) with check (public.eh_admin() and periodo = public.periodo_atual());
create policy "admin apaga evoluções do mês aberto" on public.evolucoes for delete to authenticated using (public.eh_admin() and periodo = public.periodo_atual());
create policy "profissional lê evoluções dos seus pacientes" on public.evolucoes for select to authenticated using (public.atende_paciente(paciente_id));
create policy "profissional grava a própria evolução do mês aberto" on public.evolucoes for insert to authenticated with check (profissional_id = public.meu_profissional_id() and public.atende_paciente(paciente_id) and periodo = public.periodo_atual());
create policy "profissional atualiza a própria evolução do mês aberto" on public.evolucoes for update to authenticated using (profissional_id = public.meu_profissional_id() and periodo = public.periodo_atual()) with check (profissional_id = public.meu_profissional_id() and public.atende_paciente(paciente_id) and periodo = public.periodo_atual());

create policy "admin lê histórico" on public.historico_mensal for select to authenticated using (public.eh_admin());
create policy "profissional lê histórico dos seus pacientes" on public.historico_mensal for select to authenticated using (public.atende_paciente(paciente_id));
create policy "admin registra no mês aberto" on public.historico_mensal for insert to authenticated with check (public.eh_admin() and periodo = public.periodo_atual());
create policy "admin altera no mês aberto" on public.historico_mensal for update to authenticated using (public.eh_admin() and periodo = public.periodo_atual()) with check (public.eh_admin() and periodo = public.periodo_atual());
create policy "admin apaga no mês aberto" on public.historico_mensal for delete to authenticated using (public.eh_admin() and periodo = public.periodo_atual());

create policy "admin gerencia sessões" on public.sessoes for all to authenticated using (public.eh_admin()) with check (public.eh_admin());
create policy "profissional lê sessões dos seus pacientes" on public.sessoes for select to authenticated using (public.atende_paciente(paciente_id));
create policy "profissional agenda as próprias sessões" on public.sessoes for insert to authenticated with check (profissional_id = public.meu_profissional_id() and public.atende_paciente(paciente_id));

create policy "admin vê indisponibilidades" on public.indisponibilidades for select to authenticated using (public.eh_admin());
create policy "profissional gerencia a própria indisponibilidade" on public.indisponibilidades for all to authenticated using (profissional_id = public.meu_profissional_id()) with check (profissional_id = public.meu_profissional_id());

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profissionais, public.pacientes, public.evolucoes, public.sessoes, public.indisponibilidades, public.historico_mensal to authenticated;
grant execute on function public.periodo_atual() to authenticated;
grant select on public.perfis, public.senhas_acesso to authenticated;

-- Contas de acesso ------------------------------------------------------------

create function privado.email_de_acesso(p_usuario text) returns text
language sql immutable as $$
  select lower(trim(p_usuario)) || '@painel.mente-transformacao.invalid'
$$;

create function privado.criar_usuario(p_usuario text, p_senha text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := gen_random_uuid();
  v_email text := privado.email_de_acesso(p_usuario);
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
    extensions.crypt(p_senha, extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, v_id::text,
    jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true), 'email', now(), now(), now());
  return v_id;
end $$;

create function privado.validar_acesso(p_usuario text, p_senha text, p_tamanho_minimo int) returns void
language plpgsql as $$
begin
  if p_usuario !~ '^[a-z0-9._-]{3,}$' then
    raise exception 'O usuário precisa ter 3 ou mais caracteres: letras minúsculas, números, ponto, hífen ou sublinhado.';
  end if;
  if length(p_senha) < p_tamanho_minimo then
    raise exception 'A senha precisa ter pelo menos % caracteres.', p_tamanho_minimo;
  end if;
end $$;

-- A tela de login pergunta se ainda falta criar a administradora.
create function public.precisa_configurar() returns boolean
language sql stable security definer set search_path = '' as $$
  select not exists (select 1 from public.perfis where papel = 'admin')
$$;

-- Funciona uma única vez: cria a conta da administradora quando ainda não existe nenhuma.
create function public.criar_primeiro_admin(p_usuario text, p_senha text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('mt-primeiro-admin'));
  if not public.precisa_configurar() then
    raise exception 'A administradora já foi cadastrada.';
  end if;
  perform privado.validar_acesso(p_usuario, p_senha, 8);
  v_id := privado.criar_usuario(p_usuario, p_senha);
  insert into public.perfis (user_id, usuario, papel) values (v_id, p_usuario, 'admin');
end $$;

-- Cria ou altera o usuário e a senha de um profissional (só a administradora).
create function public.salvar_acesso(p_profissional_id text, p_usuario text, p_senha text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_email text := privado.email_de_acesso(p_usuario);
begin
  if not public.eh_admin() then
    raise exception 'Somente a administração pode alterar acessos.';
  end if;
  perform privado.validar_acesso(p_usuario, p_senha, 6);
  if exists (select 1 from public.perfis where usuario = p_usuario and profissional_id is distinct from p_profissional_id) then
    raise exception 'Este usuário já está em uso.';
  end if;
  select user_id into v_id from public.perfis where profissional_id = p_profissional_id;
  if v_id is null then
    v_id := privado.criar_usuario(p_usuario, p_senha);
    insert into public.perfis (user_id, usuario, papel, profissional_id) values (v_id, p_usuario, 'profissional', p_profissional_id);
  else
    update auth.users set email = v_email, encrypted_password = extensions.crypt(p_senha, extensions.gen_salt('bf')), updated_at = now() where id = v_id;
    update auth.identities set identity_data = identity_data || jsonb_build_object('email', v_email), updated_at = now() where user_id = v_id and provider = 'email';
    update public.perfis set usuario = p_usuario where user_id = v_id;
  end if;
  insert into public.senhas_acesso (user_id, senha) values (v_id, p_senha)
    on conflict (user_id) do update set senha = excluded.senha;
end $$;

-- Remove o profissional e a conta de acesso dele (só a administradora).
create function public.remover_profissional(p_id text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.eh_admin() then
    raise exception 'Somente a administração pode remover profissionais.';
  end if;
  delete from auth.users where id in (select user_id from public.perfis where profissional_id = p_id);
  delete from public.profissionais where id = p_id;
end $$;

revoke all on schema privado from public, anon, authenticated;
revoke execute on all functions in schema privado from public, anon, authenticated;
revoke execute on function public.eh_admin(), public.meu_profissional_id(), public.atende_paciente(text),
  public.precisa_configurar(), public.criar_primeiro_admin(text, text),
  public.salvar_acesso(text, text, text), public.remover_profissional(text) from public, anon, authenticated;
grant execute on function public.eh_admin(), public.meu_profissional_id(), public.atende_paciente(text),
  public.salvar_acesso(text, text, text), public.remover_profissional(text) to authenticated;
grant execute on function public.precisa_configurar(), public.criar_primeiro_admin(text, text) to anon, authenticated;

-- Equipe inicial -----------------------------------------------------------------

insert into public.profissionais (id, nome, especialidade, registro, atuacao) values
  ('prof-lorrayne', 'Lorrayne Kendaly Luna Costa', 'Neuropsicologia', 'CRP 10/11303', 'Avaliação neuropsicológica, psicoterapia infantil e orientação parental. Pós-graduanda em Intervenção ABA para Autismo e Deficiência Intelectual.'),
  ('prof-gabrielly', 'Gabrielly Lima', 'Nutrição', 'CRN-7 17462/P', 'Nutrição clínica e hospitalar. Especialização em andamento em Nutrição em Neuropsiquiatria.'),
  ('prof-eduardo', 'Eduardo Vilhena', 'Psicologia', 'CRP 10/11278', 'Terapia Cognitivo-Comportamental (TCC), avaliação psicológica e acompanhamento em saúde mental.'),
  ('prof-psicanalista', 'Psicóloga e psicanalista (nome a informar)', 'Psicologia', '', 'Escuta psicanalítica para adolescentes, adultos, idosos e casais. Especialista em Saúde Mental.'),
  ('prof-costa', 'Dr. Costa', 'Fonoaudiologia', '', 'Fonoaudiólogo e terapeuta ABA. Comunicação e linguagem, motricidade orofacial e dificuldades alimentares em crianças e adultos neurodivergentes.'),
  ('prof-audrey', 'Audrey Andrade', 'Neuropsicologia', 'CRP 10/06517', 'Neuropsicologia.'),
  ('prof-moniele', 'Moniele Matos', 'Psicopedagogia', '', 'Psicopedagoga clínica, especialista em neuropsicologia.'),
  ('prof-nessia', 'Néssia Arruda', 'Psicomotricidade', '', 'Psicomotricista.'),
  ('prof-laiane', 'Laiane de Paula', 'Nutrição', 'CRN 7/17265', 'Nutricionista.');
