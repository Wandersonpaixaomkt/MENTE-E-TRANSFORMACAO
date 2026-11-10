# Portal clínico · Mente e Transformação (demonstração)

Protótipo navegável do web app proposto à clínica. HTML, CSS e JavaScript puros: não precisa instalar nada.

**Como abrir:** dê duplo clique em `index.html`. Para pré-visualizar com servidor local: `node .claude/serve.js` e acesse http://localhost:8765.

## O que a demo mostra

| Pilar da proposta | Onde ver |
|---|---|
| Painel centralizado de pacientes | Painel, Pacientes, aba **Resumo** do paciente |
| Formulários clínicos estruturados | Aba **Metas** → clicar numa meta ou **Nova meta** (área bloqueada para não‑admin, nada é apagado) |
| Mapa visual automático + relatório para os pais | Aba **Mapa visual** (radar + linha do tempo) e botão **Relatório para os pais** (imprimir / salvar PDF) |
| Permissões e auditoria | **Equipe e permissões** (matriz com 5 permissões) e **Auditoria** (só admin) |
| Alertas de prazo | Sino no topo e página **Prazos** (aviso 15 dias antes da reavaliação) |

**Login:** por enquanto existe um único usuário, `@dravania` (Vânia, administradora). A senha não fica no código, só o hash (SHA-256), e após 5 tentativas erradas o login trava por 30 s. Os outros profissionais aparecem na equipe, mas ainda não têm acesso próprio. Para cadastrar outro usuário, adicione uma linha em `USERS` no `js/data.js` com o hash de `mt-portal:<usuario>:<senha>`.

## Celular

Layout responsivo (testado em 375 px e 768 px): barra de navegação fixa no topo (Painel, Pacientes, Prazos, Mais), formulários em gaveta, filtros com rolagem lateral, tabelas em cartões e matriz de permissões em cartões. Ao abrir o site no celular e escolher "Adicionar à tela inicial", ele abre como app (ícone e `manifest.webmanifest` incluídos).

## Observações importantes

- **Todos os pacientes são fictícios.** A equipe é a mapeada da clínica (Vânia, Audrey, Moniele, Néssia, Laiane, Gabrielly).
- Os dados ficam salvos só no navegador (`localStorage`). Em **Equipe e permissões → Restaurar dados originais** a demo volta ao início.
- Login e permissões funcionam só na tela: sem servidor, quem tiver acesso aos arquivos consegue contornar. Isso não protege dados reais. Para produção são necessários: autenticação real, banco de dados em servidor, regras validadas no back-end, backup e adequação à LGPD (dados de saúde de crianças são sensíveis).

## Estrutura

```
index.html
css/styles.css
js/data.js     dados fictícios, constantes e persistência
js/charts.js   radar, anel de progresso e linha do tempo (SVG/HTML)
js/app.js      rotas, telas, permissões, formulários, auditoria, alertas
assets/        logo e fotos da clínica
```
