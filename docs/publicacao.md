# Plano de publicação e verificação — Issue #26

## Estratégia adotada

- Aplicação estática, sem build e sem backend; arquivos de produção são apenas `index.html`, CSS, JavaScript de interface e motor `model/*.js`.
- Workflow `.github/workflows/pages.yml` observa a conclusão do workflow `tests` na branch `main`. Ele só gera deployment quando **todos os jobs** daquele workflow forem aprovados.
- `actions/configure-pages@v5` tenta habilitar Pages; `upload-pages-artifact@v3` envia `_site`; `deploy-pages@v4` publica.
- Deploy é promovido a partir da revisão `head_sha` que realmente passou nos testes, evitando publicar alterações posteriores ainda não testadas.
- O workflow não possui disparo manual que contorne a suíte de testes.

## Ativação eventualmente necessária

Caso o job `Configure GitHub Pages` falhe por falta de configuração/permissão, é indispensável uma mudança administrativa na interface GitHub:

1. Acessar https://github.com/henriquecrang/custo-veiculo/settings/pages
2. Em **Build and deployment**, selecionar **Source: GitHub Actions**.
3. Retomar a execução ao integrar uma alteração adicional na `main` para iniciar novamente `tests`; a publicação será acionada após sucesso.
4. Verificar a aba [Actions](https://github.com/henriquecrang/custo-veiculo/actions) para o job `Publish GitHub Pages`, sem presumir sucesso pela existência do YAML.

## Condições obrigatórias para encerrar a issue

- [ ] Todos os jobs do workflow `tests` (incluindo navegador) aprovados para a revisão publicada.
- [ ] Workflow Pages `deploy` aprovado, com URL efetivamente emitida pelo GitHub.
- [ ] URL https://henriquecrang.github.io/custo-veiculo/ responde e carrega o app.
- [ ] Realizar comparação de 5 cenários; verificar cards, valores, edição de entrada e tabela em navegador.
- [ ] Não existem erros de JS em navegador ou links/scripts 404.
- [ ] README aponta corretamente para a URL **verificada**.

**Estado deste documento:** preparação de deployment, sem comprovação de publicação. Mesmo com CI aprovado, o trabalho administrativo de Pages pode bloquear a saída pública.

## Segurança e dados

O site não tem cookies de servidor, API de cotação nem contas de usuário. O JSON da simulação permanece em `localStorage` no navegador e o usuário decide quando exportar/importar; não publicar arquivos pessoais identificáveis no GitHub.
