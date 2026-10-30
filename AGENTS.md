# Desenvolvimento no ambiente em nuvem

Este repositório está em fase de inicialização e ainda não possui uma stack, gerenciador de dependências nem comandos de execução definidos.

## Ambiente

- O GitHub Codespaces é configurado por `.devcontainer/devcontainer.json`.
- A imagem base é Ubuntu com o usuário não administrativo `vscode`.
- A mesma configuração é deliberadamente neutra para permitir uso em ambientes Codex Cloud sem impor ferramentas ou versões prematuras.

## Ao iniciar o projeto

1. Identifique a stack pelos arquivos que forem adicionados (por exemplo, `package.json`, `pyproject.toml`, `requirements.txt` ou equivalente).
2. Documente os comandos de instalação, desenvolvimento, testes e build neste arquivo ou no README.
3. Fixe versões de runtime e dependências no mecanismo nativo da stack.
4. Nunca registre segredos; use os mecanismos de secrets do Codespaces e do provedor de execução.
