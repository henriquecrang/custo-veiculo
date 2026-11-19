# QA ponta a ponta — Custo Veículo (Issue #25)

## Reprodutibilidade

- Testes financeiros: `npm test` (Node 22, `regression`).
- Smoke real com Chromium: `python3 tests/browser_smoke.py`.
- Dependências Playwright Python 1.55.0; job GitHub Actions `browser` usa Ubuntu 24.04 e instalação de Chromium na própria execução.
- O servidor estático é iniciado pelo teste; nenhum backend ou preço externo é necessário.
- Screenshots geradas em `artifacts/browser-desktop.png` e `artifacts/browser-mobile.png` (anexadas ao job `browser` como artefato).

## Matriz de verificação automatizada

| Bloco | O que o smoke valida |
| --- | --- |
| Carregamento | Cinco estratégias no preset, ausência de exceções JavaScript não tratadas |
| Dashboard | Distinção de custo simulado e equivalência não verificada |
| Gráficos | 5 barras, SVG mensal e 25 células da matriz de sensibilidade |
| Edição | Atualização econômica com nova cotação do carro e salvamento local |
| Erro | Entrada acima do valor do veículo gera validação e não grava cenário inválido |
| Filtro | Desligar assinatura reduz a 4 cenários e remove equilíbrio dependente |
| Wizard | Cancelar preserva estado; completar cria preset; restaurar com confirmação |
| JSON | Exportar, modificar premissa, importar original e bloquear JSON inválido |
| Mobile | Viewport 390×844, ausência de overflow horizontal do documento, screenshot |

## Resultados documentados no desenvolvimento

- Primeira tentativa: instalação Playwright incompatível com Ubuntu 26.04 da imagem `ubuntu-latest`; job movido para Ubuntu 24.04.
- Segunda tentativa: três de quatro testes de navegador concluídos; a verificação de importação estava sujeita a uma corrida assíncrona.
- Terceira tentativa: teste de importação passou a esperar a persistência no `localStorage` antes de comparar.
- Quarta tentativa: confirmação nativa substituída por callback determinístico no teste; a lógica de confirmação do aplicativo permanece exercitada no teste de restauração.
- **CI final:** verificar os jobs `regression` e `browser` no PR #64. Não declarar a issue concluída enquanto algum job estiver sem `success`.

## Verificações que o smoke não prova

- Compatibilidade com Safari/iOS e Firefox (Chromium apenas).
- Correção de valores de uma proposta bancária, tarifa tributária ou assinatura real.
- Qualidade visual humana de todos os tamanhos de tela, textos ou cores; screenshots ficam para inspeção.
- Semântica integral de leitor de telas, zoom de 200% e acessibilidade WCAG completa.
- Publicação real do GitHub Pages (Issue #26).

Esses limites não invalidam os testes de regressão, mas devem ser considerados antes de declarar prontidão de produção.
