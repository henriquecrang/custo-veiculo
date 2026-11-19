# Custo Veículo

Simulador web estático para comparar **compra à vista, financiamento, assinatura e locação de carro** com fluxo de caixa mensal, desvalorização, custos de transação, manutenção e custo de oportunidade do dinheiro em **todos** os desembolsos.

**Status:** implementação inicial em desenvolvimento. O resultado é um modelo financeiro parametrizável, **não** uma cotação bancária, proposta de assinatura ou aconselhamento financeiro.

## Recursos atuais

- Cinco estratégias simultâneas: à vista/financiada × particular/loja, e assinatura.
- Financiamento Price e SAC; quitação do saldo ao vender sem cobrar parcelas futuras.
- IPVA, seguro, manutenção por tempo, garagem, km variável, despesas de compra/venda, IOF configurável e outros custos contratuais.
- Análise econômica mensal com valor equivalente final, desembolso nominal, custo de oportunidade, mensalidade equivalente, caixa máximo exigido e patrimônio recuperado.
- Painel de resultados e memória de cálculo mensal com exportação CSV.
- Autosave no navegador e importação/exportação JSON versionado.
- Presets de exemplo em `presets/rio-80k-12m.json` e `presets/rio-60k-12m.json`, com premissas de mercado **não verificadas como cotações reais**.
- Ponto de equilíbrio para mensalidade de locação e preço referência de revenda, pelo mesmo motor ([issue #21](https://github.com/henriquecrang/custo-veiculo/issues/21)).

## Como executar

**Localmente:** utilize um servidor HTTP estático na raiz do repositório, por exemplo:

```bash
python3 -m http.server 8080
```

Abra `http://localhost:8080/`. O aplicativo não exige build, dependências do navegador ou backend. Um servidor local evita limitações de leitura de arquivos ao usar `file://`.

**Testes:** instale Node 22 ou superior e rode:

```bash
npm test
```

O workflow GitHub Actions `tests` executa o job `regression` em PRs e pushes para `main`.

## Publicação GitHub Pages

Endereço esperado: https://henriquecrang.github.io/custo-veiculo/ — **não confundir URL esperada com publicação confirmada**.

O workflow `.github/workflows/pages.yml` publica automaticamente os arquivos estáticos de uma revisão da `main` **após sucesso dos testes** (`regression` e `browser` na suíte `tests`). Ele usa Pages artifact e não requer build ou backend.

Na primeira implantação, o workflow `actions/configure-pages@v5` tenta habilitar Pages (`enablement: true`). **Se o GitHub negar essa operação**, configurar no repositório **Settings → Pages → Build and deployment → Source: GitHub Actions**; o conector atual não possui ação administrativa de Pages.

A publicação só será considerada concluída quando o workflow de deploy estiver verde, o endereço HTTP responder e a simulação renderizar no navegador real. Consulte [plano de publicação e validação](docs/publicacao.md).

## Modelo e premissas

A fonte de verdade econômica é [docs/especificacao-modelo.md](docs/especificacao-modelo.md). O [plano inicial](docs/plano-projeto.md) inclui decisões de projeto e roadmap; [testes de regressão](docs/auditoria-regressoes.md) descrevem hipóteses numéricas verificadas.

Convenções-chave:
- Saída de dinheiro negativa; receita de venda e caução devolvida positivas.
- Custo econômico = equivalente no mês final de cada fluxo; a taxa de oportunidade é a mesma na compra e na assinatura.
- A depreciação é refletida na revenda, não somada outra vez como uma despesa.
- Taxas comerciais e impostos são parâmetros que devem ser confirmados conforme o contrato e local.
- O Argo por assinatura do exemplo **não é veículo equivalente** ao seminovo hipotético de R$ 80 mil.

## Dados e privacidade

Os parâmetros de simulação são mantidos no navegador via `localStorage`; importação/exportação é um arquivo JSON local. O site não possui backend. **Não inclua CPF, placa, contratos pessoais identificáveis ou credenciais** no repositório público.

## Desenvolvimento

Consultar [AGENTS.md](AGENTS.md) e [docs/workflow-desenvolvimento.md](docs/workflow-desenvolvimento.md). Adotamos issues → branch → PR → CI → revisão → merge; problemas de premissas e cálculos exigem teste de regressão e documentação.

