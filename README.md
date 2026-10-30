# Mente & Transformação

Painel clínico inicial para gestão de anamnese, encaminhamento multidisciplinar, evolução profissional e relatório integrado.

## Primeira entrega

- Entrada demonstrativa para Administrativo e Profissional.
- Cadastro de profissionais por nome, especialidade e código/registro.
- Ficha de anamnese com responsáveis dinâmicos, hipótese, documentos e queixa familiar.
- Seleção individual de profissionais para cada paciente.
- Área profissional com notificações, registros de evolução e agenda de sessões.
- Relatório integrado pronto para impressão, com os conteúdos preenchidos pela equipe.

## Executar localmente

O projeto não exige instalação de dependências nesta etapa. No diretório do projeto, execute:

```bash
python3 -m http.server 4173
```

Depois, abra `http://localhost:4173` no navegador.

Os dados de demonstração ficam somente no armazenamento local do navegador. A conexão com autenticação, banco de dados e armazenamento seguro de anexos será feita nas próximas etapas.
