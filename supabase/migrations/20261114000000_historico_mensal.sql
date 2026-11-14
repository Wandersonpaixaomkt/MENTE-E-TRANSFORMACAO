-- Histórico mensal do paciente e fechamento mensal dos relatórios.
-- Aplicada em produção em 14/11/2026, depois de 20261113000000_manage_access_and_anamnese.sql (usa tem_permissao).
-- As evoluções existentes passam a pertencer ao mês em que foram atualizadas. Mês de referência = fuso de Belém; meses passados ficam somente leitura.

begin;

create function public.periodo_atual() returns text
language sql stable set search_path = '' as $$
  select to_char(now() at time zone 'America/Belem', 'YYYY-MM')
$$;

-- Evoluções passam a ser mensais ------------------------------------------------

alter table public.evolucoes add column periodo text not null default public.periodo_atual();
update public.evolucoes set periodo = to_char(atualizado_em, 'YYYY-MM');
alter table public.evolucoes drop constraint evolucoes_pkey;
alter table public.evolucoes add primary key (paciente_id, profissional_id, periodo);

drop policy "admin gerencia evoluções" on public.evolucoes;
drop policy "profissional grava a própria evolução" on public.evolucoes;
drop policy "profissional atualiza a própria evolução" on public.evolucoes;

create policy "admin lê evoluções" on public.evolucoes for select to authenticated using (public.eh_admin());
create policy "admin grava evoluções do mês aberto" on public.evolucoes for insert to authenticated with check (public.eh_admin() and periodo = public.periodo_atual());
create policy "admin altera evoluções do mês aberto" on public.evolucoes for update to authenticated using (public.eh_admin() and periodo = public.periodo_atual()) with check (public.eh_admin() and periodo = public.periodo_atual());
create policy "admin apaga evoluções do mês aberto" on public.evolucoes for delete to authenticated using (public.eh_admin() and periodo = public.periodo_atual());
create policy "profissional grava a própria evolução do mês aberto" on public.evolucoes for insert to authenticated with check (public.tem_permissao('registrar_evolucao') and profissional_id = public.meu_profissional_id() and public.atende_paciente(paciente_id) and periodo = public.periodo_atual());
create policy "profissional atualiza a própria evolução do mês aberto" on public.evolucoes for update to authenticated using (public.tem_permissao('registrar_evolucao') and profissional_id = public.meu_profissional_id() and periodo = public.periodo_atual()) with check (public.tem_permissao('registrar_evolucao') and profissional_id = public.meu_profissional_id() and public.atende_paciente(paciente_id) and periodo = public.periodo_atual());

-- Histórico descrito do paciente, mês a mês ---------------------------------------

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

alter table public.historico_mensal enable row level security;

create policy "admin lê histórico" on public.historico_mensal for select to authenticated using (public.eh_admin());
create policy "profissional lê histórico dos seus pacientes" on public.historico_mensal for select to authenticated using (public.atende_paciente(paciente_id));
create policy "admin registra no mês aberto" on public.historico_mensal for insert to authenticated with check (public.eh_admin() and periodo = public.periodo_atual());
create policy "admin altera no mês aberto" on public.historico_mensal for update to authenticated using (public.eh_admin() and periodo = public.periodo_atual()) with check (public.eh_admin() and periodo = public.periodo_atual());
create policy "admin apaga no mês aberto" on public.historico_mensal for delete to authenticated using (public.eh_admin() and periodo = public.periodo_atual());

grant select, insert, update, delete on public.historico_mensal to authenticated;
grant execute on function public.periodo_atual() to authenticated;

commit;
