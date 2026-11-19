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
- Ponto de equilíbrio de aluguel e revenda: em implementação na [issue #21](https://github.com/henriquecrang/custo-veiculo/issues/21).

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

Publicação estática prevista: `https://henriquecrang.github.io/custo-veiculo/` **(URL esperada, não verificada como ativa)**.

Para ativar: no GitHub, abrir **Settings → Pages → Build and deployment → Deploy from a branch**, escolher `main` e `/(root)`. O arquivo `.nojekyll` já está presente. Depois da ativação, verificar a URL e executar ao menos um cenário no navegador; somente então concluir a [issue #26](https://github.com/henriquecrang/custo-veiculo/issues/26).

> A configuração administrativa do GitHub Pages não está disponível nas ações atuais do conector. Criar arquivos e documentar o deploy **não** significa que ele já tenha sido habilitado.

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

