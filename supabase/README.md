# Atualização de usuários e anamnese

`migrations/20261113000000_manage_access_and_anamnese.sql` prepara o banco para a versão de gestão de acessos.

- acrescenta autoria imutável ao cadastro de anamnese;
- permite que profissionais criem a ficha inicial, conforme a permissão atribuída;
- adiciona permissões para anamnese, evolução e agenda;
- substitui a consulta de senhas em texto por geração/redefinição pontual;
- protege as mesmas ações na camada RLS do banco.

O arquivo não contém credenciais. A atualização de usuários existentes e a criação da conta profissional da Dra. Vânia devem ser feitas depois da migração, em uma operação administrativa segura — nunca por commit.

Antes de aplicar em produção, faça backup, teste em ambiente separado e valide ao menos: login administrativo, login profissional, criação de anamnese, bloqueio de ações desativadas e encaminhamento.
