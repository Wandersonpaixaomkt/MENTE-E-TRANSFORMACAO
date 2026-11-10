# Mente & Transformação

Painel clínico para anamnese, encaminhamento multidisciplinar, evolução profissional, agenda e relatório integrado. HTML, CSS e JavaScript puros: não precisa instalar nada.

**Como abrir:** dê duplo clique em `index.html`, ou rode `node .claude/serve.js` e acesse http://localhost:8765.

## O que tem

- **Administradora (Dra. Vânia Ferreira Garcia):** cadastra profissionais, faz a anamnese, encaminha cada paciente aos profissionais e agenda os atendimentos.
- **Profissionais:** recebem os casos encaminhados, registram queixa, plano de ação e evolução, marcam na **Minha agenda** os dias e horários em que não podem atender.
- **Acessos:** ao cadastrar um profissional, o sistema gera usuário e senha. Em **Profissionais**, clicar num nome mostra e permite editar os dados, o usuário e a senha (só a administradora).
- **Agendamento:** em **Encaminhamentos**, ao escolher os profissionais do paciente, a administradora marca os dias e horários; dias e horários indisponíveis ficam bloqueados. Atendimentos de 60 minutos, das 08:00 às 17:00.
- **Relatório integrado** pronto para impressão.

## Login

- Administradora: `dravania` / `12345678` (senha provisória: troque antes de usar dados reais).
- Profissionais: usuário e senha gerados pela administradora em **Profissionais**.

## Observações

- Pacientes são fictícios. A equipe reúne os profissionais da clínica (Lorrayne, Gabrielly, Eduardo, psicóloga psicanalista, Dr. Costa, Audrey, Moniele, Néssia e Laiane); dados ainda não informados aparecem como "a informar".
- Os dados ficam salvos só no navegador (`localStorage`), e as senhas dos profissionais ficam guardadas ali para a administradora consultar. Sem servidor, login e permissões são só uma barreira de tela. Para uso real com dados de pacientes são necessários servidor, banco de dados, autenticação real e adequação à LGPD.

## Estrutura

```
index.html
styles.css
app.js                 dados de demonstração, telas, permissões, agenda
manifest.webmanifest
assets/                logo, ícones e fotos da clínica
```
