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
| Acesso dos profissionais | **Equipe e permissões** → clicar num profissional para ver e editar dados, usuário e senha; **Adicionar profissional** gera usuário e senha automaticamente (só admin) |
| Agenda e indisponibilidade | **Agenda**: cada profissional marca dias e horários em que não pode atender; a ficha do paciente → aba **Atendimentos** agenda horários e bloqueia os indisponíveis (só admin agenda) |

**Login:** a administradora entra com `dravania` / `12345678` (senha provisória: troque antes de usar dados reais). Os outros profissionais entram com o usuário e a senha gerados pela administradora em **Equipe e permissões**. A senha da administradora fica no código só como hash (SHA-256); as dos profissionais ficam salvas no navegador para que a administradora possa consultá-las. Após 5 tentativas erradas o login trava por 30 s.

## Celular

Layout responsivo (testado em 375 px e 768 px): barra de navegação fixa no topo (Painel, Pacientes, Prazos, Mais), formulários em gaveta, filtros com rolagem lateral, tabelas em cartões e matriz de permissões em cartões. Ao abrir o site no celular e escolher "Adicionar à tela inicial", ele abre como app (ícone e `manifest.webmanifest` incluídos).

## Observações importantes

- **Todos os pacientes são fictícios.** A equipe é a mapeada da clínica (Vânia, Audrey, Moniele, Néssia, Laiane, Gabrielly) mais Lorrayne, Eduardo, a psicóloga psicanalista (nome a informar) e o Dr. Costa (registro a informar).
- Atendimentos duram 60 minutos, com horários das 08:00 às 17:00 (`SLOTS` e `DURACAO_MIN` em `js/data.js`).
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
