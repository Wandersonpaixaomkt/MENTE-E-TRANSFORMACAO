-- A tabela legada contém um histórico de senhas em texto que não é usado pelo
-- sistema atual. Mantemos os registros para uma futura auditoria de backup,
-- mas bloqueamos explicitamente qualquer acesso pelo Data API.
drop policy if exists "arquivo de senhas bloqueado" on public.senhas_acesso;
create policy "arquivo de senhas bloqueado"
on public.senhas_acesso
for all
to authenticated
using (false)
with check (false);
