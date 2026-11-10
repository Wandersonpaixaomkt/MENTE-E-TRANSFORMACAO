# Mente & Transformação

Painel clínico para anamnese, encaminhamento multidisciplinar, evolução profissional, agenda e relatório integrado. HTML, CSS e JavaScript puros, com os dados e o login no Supabase.

**Como abrir:** dê duplo clique em `index.html`, ou rode `node .claude/serve.js` e acesse http://localhost:8765. Precisa de internet.

## O que tem

- **Administradora (Dra. Vânia Ferreira Garcia):** cadastra profissionais, faz a anamnese, encaminha cada paciente aos profissionais e agenda os atendimentos.
- **Profissionais:** veem só os pacientes encaminhados a eles, registram queixa, plano de ação e evolução, e marcam na **Minha agenda** os dias e horários em que não podem atender.
- **Acessos:** ao cadastrar um profissional, o sistema gera usuário e senha. Em **Profissionais**, clicar num nome mostra e permite editar os dados, o usuário e a senha (só a administradora).
- **Agendamento:** em **Encaminhamentos**, ao escolher os profissionais do paciente, a administradora marca os dias e horários; dias e horários indisponíveis ficam bloqueados. Atendimentos de 60 minutos, das 08:00 às 17:00.
- **Relatório integrado** pronto para impressão.

## Banco de dados (Supabase)

- Projeto **MENTE E TRANSFORMACAO**, organização PROJETOS WANDERSON MKT, região São Paulo: https://supabase.com/dashboard/project/smguazmpzynstoztrsuv
- `supabase/schema.sql` cria as tabelas (`profissionais`, `perfis`, `senhas_acesso`, `pacientes`, `evolucoes`, `sessoes`, `indisponibilidades`), as regras de acesso (RLS) e as funções de conta. Já foi executado; só rode de novo num projeto novo.
- `config.js` guarda o endereço do projeto e a chave publicável. Essa chave pode ficar no navegador; a chave secreta nunca entra neste projeto.
- O cadastro aberto está desligado no Supabase: contas só nascem pela tela de primeiro acesso (uma única vez, para a administradora) ou pelo cadastro de profissionais.

## Login

- **Primeiro acesso:** enquanto não existe administradora, a tela de login pede para criar o usuário e a senha dela. Depois disso a tela vira o login normal.
- Profissionais: usuário e senha gerados pela administradora em **Profissionais**.
- Por trás, cada usuário vira um e-mail interno (`usuario@painel.mente-transformacao.invalid`) que nunca recebe mensagens. Não existe "esqueci minha senha": quem troca senha é a administradora.

## Observações

- A equipe inicial reúne os profissionais da clínica (Lorrayne, Gabrielly, Eduardo, psicóloga psicanalista, Dr. Costa, Audrey, Moniele, Néssia e Laiane); dados ainda não informados aparecem como "a informar". Não há pacientes de exemplo.
- As senhas dos profissionais também ficam guardadas em texto na tabela `senhas_acesso`, que só a administradora consegue ler, para que ela possa consultá-las.
- Antes de usar com pacientes reais, revise a adequação à LGPD (consentimento, contrato com o Supabase, quem acessa o quê).

## Estrutura

```
index.html
styles.css
config.js              endereço e chave publicável do Supabase
app.js                 telas, permissões, agenda e leitura/gravação no banco
supabase/schema.sql    tabelas, regras de acesso e equipe inicial
manifest.webmanifest
assets/                logo, ícones e fotos da clínica
```
