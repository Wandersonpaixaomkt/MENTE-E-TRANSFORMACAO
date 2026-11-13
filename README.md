# Mente & Transformação

Painel clínico para anamnese, encaminhamento multidisciplinar, evolução profissional, agenda e relatório integrado. HTML, CSS e JavaScript puros, com os dados e o login no Supabase.

**Como abrir:** dê duplo clique em `index.html`, ou rode `node .claude/serve.js` e acesse http://localhost:8765. Precisa de internet.

## O que tem

- **Administração:** cadastra profissionais, gerencia usuários, cria a anamnese, encaminha cada paciente e agenda atendimentos.
- **Profissionais:** podem criar a ficha inicial de anamnese e veem os casos encaminhados a eles. As ações de anamnese, evolução e agenda são liberadas individualmente pela administração.
- **Usuários e ações:** a administração cria logins administrativos ou profissionais, redefine senhas, desativa acessos e define as ações de cada profissional. Senhas novas aparecem uma única vez, apenas na hora da criação ou redefinição.
- **Agendamento:** em **Encaminhamentos**, ao escolher os profissionais do paciente, a administradora marca os dias e horários; dias e horários indisponíveis ficam bloqueados. Atendimentos de 60 minutos, das 08:00 às 17:00.
- **Relatório integrado** pronto para impressão.

## Banco de dados (Supabase)

- Projeto **MENTE E TRANSFORMACAO**, organização PROJETOS WANDERSON MKT, região São Paulo: https://supabase.com/dashboard/project/smguazmpzynstoztrsuv
- `supabase/schema.sql` é a base inicial. Para esta versão, aplique também a migração `supabase/migrations/20261113000000_manage_access_and_anamnese.sql`, que adiciona autoria de anamnese e permissões por usuário.
- `config.js` guarda o endereço do projeto e a chave publicável. Essa chave pode ficar no navegador; a chave secreta nunca entra neste projeto.
- O cadastro aberto está desligado no Supabase: contas só nascem pela tela de primeiro acesso (uma única vez) ou por uma conta administrativa já autenticada.

## Login

- **Primeiro acesso:** enquanto não existe administradora, a tela de login pede para criar o usuário e a senha dela. Depois disso a tela vira o login normal.
- Profissionais: usuário e senha definidos pela administração em **Usuários e ações**.
- Por trás, cada usuário vira um e-mail interno (`usuario@painel.mente-transformacao.invalid`) que nunca recebe mensagens. Não existe "esqueci minha senha": quem troca senha é a administradora.

## Observações

- A equipe inicial reúne os profissionais da clínica (Lorrayne, Gabrielly, Eduardo, psicóloga psicanalista, Dr. Costa, Audrey, Moniele, Néssia e Laiane); dados ainda não informados aparecem como "a informar". Não há pacientes de exemplo.
- A migração de usuários interrompe a leitura e a gravação de senhas em texto. A tabela antiga fica inacessível durante a transição e só deve ser removida depois de um backup validado.
- Antes de usar com pacientes reais, revise a adequação à LGPD (consentimento, contrato com o Supabase, quem acessa o quê).

## Estrutura

```
index.html
styles.css
config.js              endereço e chave publicável do Supabase
app.js                 telas, permissões, agenda e leitura/gravação no banco
supabase/schema.sql    tabelas, regras de acesso e equipe inicial
supabase/migrations/   atualizações incrementais do banco
manifest.webmanifest
assets/                logo, ícones e fotos da clínica
```
