# Fontes, premissas e evidências — Custo Veículo

**Data de revisão:** 19/11/2026 · **Issue:** #24 · **Status:** calibração inicial, não cotação individual.

## 1. Política de evidências

O simulador não depende de APIs nem de preços em tempo real para calcular. Seu motor recebe entradas **editáveis**; os defaults são exemplos que precisam de validação quando houver um carro ou contrato real.

Hierarquia para decidir valores de uma operação concreta:
1. contrato/proposta efetiva de financiamento, assinatura, compra e seguro, identificando titularidade e vigência;
2. norma e tabela oficial aplicável ao tipo, município, data e categoria do veículo;
3. oferta/comparável de mercado que descreva exatamente modelo, idade, quilometragem, franquia, taxas e duração;
4. pesquisa/índice setorial com metodologia conhecida;
5. hipótese de planejamento usada no exemplo.

Nunca converter hipótese ilustrativa em obrigação legal, taxa garantida ou oferta vinculante. Data de consulta ≠ período de vigência.

## 2. Inventário inicial do preset Rio — 80 mil, 12 meses

| Campo do JSON | Valor inicial | Natureza e fonte | Limite relevante |
| --- | ---: | --- | --- |
| vehicle.price | R$ 80.000 | Hipótese de compra | Não identifica veículo ofertado |
| vehicle.residualPrice | R$ 72.000 | Hipótese de revenda após 12 meses | Desvalorização projetada de 10%; preço real pode variar |
| financing.downPayment | R$ 16.000 | Hipótese (20%) | Depende da política da financeira |
| financing.termMonths | 36 | Hipótese | Parcela pode mudar por tarifa financiada |
| financing.monthlyInterestRate | 1,96% a.m. | Hipótese de cálculo; conferir BCB e proposta | Não é cotação nem CET |
| financing.iof.amount | R$ 0 | **Não informado**, não isenção | Preencher a partir do contrato e da regra tributária vigente |
| purchase.initialCosts | R$ 0 | **Não informado** | Transferência/vistoria não desaparecem por default zero |
| financing.upfrontCosts/payoffCosts | R$ 0 | **Não informado** | Registrar tarifas reais, sem sobreposição |
| ownership.ipvaAnnual | R$ 3.200 | Provisão 4% de R$ 80.000 | O imposto efetivo depende da base tributável, tipo de veículo, UF e data |
| ownership.insuranceAnnual | R$ 4.400 | Provisão ilustrativa | Contratar/consultar proposta de seguro com perfil e cobertura |
| ownership.maintenanceMonthly | R$ 100 | Provisão ilustrativa de posse mesmo parado | Não inclui reparos extraordinários |
| ownership.kmPerMonth | 0 | Cenário deliberado de carro parado | Não elimina desgaste pelo tempo |
| resale.privateFixedCosts | R$ 300 | Provisão para anúncios | Pode ser zero ou diferente |
| resale.dealerDiscountPct | 15% | Hipótese de desconto de liquidez | **Não** é oferta vinculante; incide sobre valor de referência após desvalorização |
| subscription.monthlyRent | R$ 2.299 | Referência comercial usada na discussão do Argo | Não equivale necessariamente ao veículo de R$ 80 mil |
| economics.opportunityAnnualNet | 11,26% a.a. | Hipótese de retorno alternativo **líquido** | Não é taxa garantida no futuro |
| economics.inflationAnnual | 4,3% a.a. | Hipótese ilustrativa | Não entra no custo econômico nominal do MVP |

**Nunca interpretar zero como gratuidade garantida.** Campos que representam tributo/encargo não informado começam em zero por limitação de evidência; relatório e memória de cálculo devem informar essa condição.

## 3. Fontes públicas verificadas

### Detran-RJ — transferência e taxas

- Procedimento de transferência: https://www.detran.rj.gov.br/todos-os-servicos/servicos-drv/transferencia-de-propriedade.html
- Tabela de taxas (DUDA): https://www.detran.rj.gov.br/veiculo/veiculos-outros/taxas-dudas.html
- A tabela consultada em 19/11/2026 apresentava **DUDA de transferência, código 014-0, R$ 209,78**. Isso **não** substitui conferir outras taxas, documentos e obrigações eventualmente aplicáveis à transação.
- O usuário deve definir no custo de aquisição se a despesa é efetivamente sua e em qual mês ocorre.

### SEFAZ-RJ — IPVA

- Referência institucional sobre IPVA e alíquotas por tipo de veículo: https://portal.fazenda.rj.gov.br/contabilidade/wp-content/uploads/sites/25/2025/09/Paginas-de-Relatorio-Gerencial-Quadrimestral-Abr-2025.pdf
- A referência apresenta **4% para veículos flex**, incidindo sobre valor venal; existem alíquotas diferentes para GNV, elétricos e motocicletas.
- A base usada no preset (R$ 80.000) é **aproximação**. A guia e o calendário do exercício real prevalecem sobre a simplificação.
- Não criar taxa genérica de documentação de R$ 100/mês se IPVA, licenciamento, DUDA e demais taxas já forem individualizados.

### Banco Central — crédito para aquisição de veículos

- Série oficial por instituição e período: https://www.bcb.gov.br/estatisticas/reporttxjuros?codigoModalidade=401101&codigoSegmento=1
- A página reúne taxas para **pessoa física — aquisição de veículos — prefixado**, separando períodos e instituições.
- A taxa de 1,96% ao mês permanece **hipótese de demonstração**; verificar a proposta, encargos, IOF e CET em cada financiamento.
- O motor não confunde taxa de juros de amortização, CET indicativo e custo de oportunidade líquido de investimento.

### Assinatura de veículo — referência comercial

- Página indicada pelo usuário: https://signboxbrasil.com.br/carro/argo#planos
- Preço, prazo, quilometragem, modelo, reajustes, coparticipação e multa devem ser conferidos na proposta escrita.
- **Comparação não equivalente:** aluguel/assinatura de Argo de exemplo × compra de seminovo hipotético de R$ 80 mil.

## 4. Itens ainda não verificados para operação concreta

- IOF e tarifas: proposta do banco, datas, base, contratação/financiamento e efetiva quitação.
- Registro de financiamento/gravame e taxas de baixa: não inferir incidência sem a modalidade contratual.
- Licenciamento, GRT, DUT/ATPV-e, vistoria e transferências: valores, ano e responsabilidade de cada parte.
- Seguro: perfil, endereço de pernoite, cobertura, franquias, existência de cobertura enquanto parado, forma de pagamento e cancelamento.
- Desvalorização: referência FIPE, anúncios comparáveis e descontos de venda efetivamente aceitos.
- Assinatura: franquia de km, multas de saída, reajustes, preço final e serviços incluídos.
- Custos por uso real: combustível, manutenção por km, pneus, garagem, estacionamento, pedágios.
- CDI/benchmark financeiro: taxa líquida por prazo e incidência efetiva de IR, sem multiplicar uma taxa bruta fixa por (1−IR) automaticamente.

## 5. Proveniência registrada no JSON e na interface

A configuração versão 1 permite um campo **opcional** `evidence`, que mapeia caminhos de premissas financeiras a metadados documentais.

- `kind`: `hypothesis`, `official`, `quote`, `user-input`, `derived` ou `unknown`.
- `asOf`: data ISO AAAA-MM-DD; `note` e `url` HTTPS opcionais.
- O preset inicial preenche fontes descritivas para custos críticos, inclusive zeros **não informados**, sempre classificados como `unknown`, não como tarifa gratuita.
- O editor avançado mostra essa informação junto a cada variável; alterar o valor classifica-o como `user-input` com a data da edição, sem herdar uma fonte antiga.
- O wizard classifica respostas confirmadas como informadas pelo usuário; respostas não revisadas preservam a classificação de hipótese.
- JSONs antigos sem `evidence` permanecem válidos.
- Os metadados **não** têm efeito nos cálculos; o motor considera os valores numéricos da configuração, e os testes verificam a invariância.

A versão atual **não** possui integração automática para validar links ou buscar preços reais. Qualquer dado classificado como `quote` deve ter sua validade conferida no contrato do fornecedor.

## 6. Governança

Quando um default mudar, alterar juntos: documentação de fonte, preset JSON, testes numéricos aplicáveis e notas de migração. A matemática é definida por [especificacao-modelo.md](especificacao-modelo.md) e o planejamento por [plano-projeto.md](plano-projeto.md). Nenhuma correção de premissa deve ser feita com um resultado numérico fixado na interface.
