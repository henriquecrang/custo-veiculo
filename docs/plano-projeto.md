# Custo Veículo — plano do projeto, decisões e roadmap

> **Status:** especificação inicial para desenvolvimento (nenhum motor/interface implementado ainda).  
> **Data-base:** 19/11/2026.  
> **Repositório:** https://github.com/henriquecrang/custo-veiculo  
> **Issue de origem:** https://github.com/henriquecrang/custo-veiculo/issues/1

## 1. Visão e problema

**Custo Veículo** será um simulador web aberto, independente e auditável para decidir entre **comprar um carro à vista, financiar a compra, contratar uma assinatura ou alugar de modo flexível**.

Não se deve comparar apenas o valor da parcela, nem tratar o preço integral de um carro como despesa definitiva: parte do desembolso vira patrimônio recuperável na revenda. Também não se deve ignorar o rendimento alternativo do dinheiro usado na entrada, nas parcelas e nos demais custos de cada estratégia.

**Perguntas principais que a ferramenta precisa responder:**
- Qual alternativa tem o menor custo econômico durante determinado horizonte?
- Quanto dinheiro efetivamente sai do bolso, quanto capital fica vinculado e quanto é recuperado ao encerrar?
- Qual mensalidade de assinatura equivale à compra? Qual preço de revenda torna a compra vantajosa?
- Como a decisão muda conforme entrada, juros, prazo, desvalorização, desconto de revenda, taxa de investimento, impostos, seguro e custos de transação?
- Vale manter um veículo por 12 meses ou alugar somente nos meses em que ele seria necessário?

**Princípio:** evidenciar **desembolsos nominais, patrimônio/dívida, custo econômico e necessidade de liquidez** em métricas separadas.

### 1.1 Referências de produto

- [viabilidade-airbnb](https://github.com/henriquecrang/viabilidade-airbnb): experiência de configuração guiada, premissas editáveis, comparações, JSON e GitHub Pages.
- [cenarios-consorcio](https://github.com/henriquecrang/cenarios-consorcio): motor financeiro puro, cronograma mensal, especificação canônica, testes de regressão e workflow issue → branch → PR → CI → revisão → merge.

A nova aplicação combinará esses princípios, **sem reutilizar o motor imobiliário para veículos** e sem herdar complexidade que não faça sentido aqui.

## 2. Escopo do produto

### 2.1 Estratégias simultâneas

| ID interno | Estratégia | Como termina no horizonte |
| --- | --- | --- |
| `cash-private` | Comprar à vista, vender a particular | Receber valor líquido de revenda |
| `cash-dealer` | Comprar à vista, vender para loja | Receber valor ofertado pela loja |
| `loan-private` | Financiar, vender a particular | Receber revenda e quitar saldo devedor |
| `loan-dealer` | Financiar, vender para loja | Receber revenda e quitar saldo devedor |
| `subscription` | Assinatura de prazo definido | Devolver veículo, liquidar taxas/reembolsos |
| `flex-rental` | Locação mensal ou intermitente | Pagar apenas períodos contratados + encargos |

Ao comparar cenários, manter a **mesma necessidade de uso/disponibilidade** ou avisar explicitamente quando não são equivalentes (ex.: comprar por 12 meses × alugar por apenas seis; carro seminovo de R$ 80 mil × Argo de assinatura).

**MVP:** compra à vista/financiada, particular/loja e assinatura anual. **Fase seguinte:** locação por meses selecionados e vários modelos/propostas.

### 2.2 Casos de uso

- **Carro parado na garagem:** `kmMes=0`; sem combustível, pedágio ou desgaste por rodagem, **mas continuam** seguro, IPVA/licenciamento, depreciação pelo tempo, taxas e manutenção preventiva pertinente.
- **Carro em uso:** quilometragem editável; combustível, manutenção por km, pneus, estacionamento/pedágios opcionais.
- **Compra com saída em 12 meses:** simular o efeito de vender com calma versus vender rapidamente para uma agência.
- **Vida com deslocamentos entre cidades:** locação apenas nos meses necessários; apresentar meses de acesso ao veículo e o custo da flexibilidade.
- **Sensibilidade:** variar preço de assinatura e valor de revenda sem alterar os demais fatores.

### 2.3 Fora do MVP

Cotação automática de seguradoras/financeiras, FIPE em tempo real, integração bancária, gestão de usuários, autenticação, backend, consórcio de veículos, compra por CNPJ, leasing empresarial, análise tributária de PJ, monetização e recomendações personalizadas de carro. Poderão entrar no backlog somente quando agregarem valor comprovado.

## 3. Decisões de projeto (registro inicial)

| ID | Decisão | Razão |
| --- | --- | --- |
| D01 | Aplicação estática (HTML, CSS, JavaScript) publicada em GitHub Pages | Baixa manutenção, transparência, sem backend |
| D02 | Motor de cálculo puro, independente do DOM | Testabilidade, rastreabilidade, reutilização |
| D03 | **Passo financeiro mensal** (`m=0..N`) | Capturar corretamente entrada, parcelas, gastos e liquidação |
| D04 | Uma **taxa de oportunidade comum** para todos os cenários | Comparação simétrica, inclusive parcelas da locação |
| D05 | Separar caixa, amortização, juros, saldo devedor, patrimônio e custo econômico | Evitar confundir parcela com perda |
| D06 | Venda particular e venda à loja como cenários separados | Liquidez tem valor/custo |
| D07 | Premissas de mercado e condições contratuais sempre editáveis e datadas | Evitar defaults apresentados como verdade |
| D08 | Seguro, IPVA, manutenções e demais despesas definidas pela responsabilidade de cada contrato | Evitar cobrar custos já incluídos na assinatura |
| D09 | Recalcular na edição e permitir exportar/importar JSON versionado | Experiência dos projetos anteriores |
| D10 | Manter documentação canônica, testes e trilha de decisões no GitHub | Prevenir deriva entre interface e fórmula |
| D11 | Preset inicial reproduz a conversa **sem congelar a resposta** | Testar o modelo com caso conhecido e corrigível |
| D12 | Não usar dados cadastrais pessoais em repositório público | Privacidade |

Decisões pendentes de validação são explicitadas na seção 11; não devem ser incorporadas silenciosamente ao motor.

## 4. Premissas configuráveis

| Bloco | Campos principais |
| --- | --- |
| Veículo | Nome/versão opcional, novo/usado, idade, preço inicial, valor de mercado projetado (ou curva de desvalorização), ano/modelo, quilometragem |
| Compra | Entrada (% e R$), capital disponível, custos de aquisição, vistoria, transferência, despesas de cadastro |
| Financiamento | Valor principal, prazo, juros mensais, sistema Price/SAC, CET informativo, IOF, tarifas, custos pagos à vista ou financiados, vencimento das parcelas |
| Propriedade | IPVA/alíquota, licenciamento, seguro, franquia se aplicável, manutenção fixa e por km, pneus, garagem, estacionamento, combustível |
| Revenda | Mês de saída, valor de referência, venda particular versus desconto de loja, despesas de venda, meses até concretizar venda, tratamento do período de anúncio |
| Assinatura/locação | Mensalidade, reajuste, duração, caução, taxa de adesão, despesas incluídas, franquia km, km excedente, coparticipação, multa de saída, reembolso da caução |
| Macroeconomia | Rendimento alternativo líquido anual, opcional CDI bruto + IR/taxas, inflação para exibição real, método de desconto/equivalência |
| Comparação | Horizonte `N` (1–60 meses inicialmente), estratégias selecionadas, carro equivalente, calendário de uso e de pagamentos |

Campos devem ter **unidade, data/origem, ajuda contextual e default**. Quando houver parâmetros em % e R$, deixar claro qual é a fonte de verdade e como o outro campo é recalculado. Rejeitar configurações economicamente impossíveis.

## 5. Convenções financeiras (normativas)

### 5.1 Tempo, sinais e benchmark

- Mês `0`: aquisição/contratação e despesas iniciais.
- Meses `1..N`: desembolsos e recebimentos na data efetiva; default de parcela no fim do mês, ajustável na versão avançada.
- `FC_m > 0` significa entrada de dinheiro; `FC_m < 0` significa saída.
- Taxa anual efetiva líquida de oportunidade `R`; taxa mensal equivalente `r=(1+R)^(1/12)-1`.
- Todos os cenários usam **a mesma base temporal e a mesma taxa**. Se `R=0`, o custo econômico deve igualar o desembolso líquido nominal.

**Custo econômico expresso no mês N (valor futuro líquido equivalente):**

```text
CE_N = - Σ[m=0..N] FC_m × (1+r)^(N-m)
```

- Fluxos positivos ao final (revenda, devolução de caução) reduzem `CE_N`.
- Não adicionar novamente “custo da entrada” nem “custo das parcelas”: esses custos de oportunidade **já estão embutidos** ao capitalizar cada fluxo.
- Para interpretar o resultado, oferecer também desembolso líquido nominal `C_nominal = -Σ FC_m` e **custo de oportunidade incremental** `CE_N - C_nominal`.
- Mensalidade econômica equivalente, para pagamentos iguais nos meses 1..N:

```text
ME_N = CE_N × r / ((1+r)^N - 1)        (r ≠ 0)
ME_N = CE_N / N                        (r = 0)
```

- O indicador equivalente mensal tem unidade R$/mês **ao longo dos N meses**; não se deve confundir com média nominal ou com a parcela da financeira.
- O motor também pode mostrar valor presente (`VP = CE_N/(1+r)^N`), usando convenção explícita.
- Para saídas negativas, o indicador pode ser negativo (ganho líquido); nunca forçar resultado a zero.

**Nota sobre rendimentos:** um valor “CDI bruto × (1−IR)” é uma aproximação, não uma aplicação correta e universal de imposto sobre rendimentos de diferentes prazos. No MVP, a taxa **líquida efetiva** será a referência principal; converter CDI bruto para líquido exigirá premissas explícitas de tributação e vencimento.

### 5.2 Compra à vista

- No `m=0`: `FC_0 = −preco − custosAquisicao`.
- Durante uso: despesas de propriedade nos respectivos meses.
- No mês de saída: receita líquida de revenda, subtraindo corretagem, anúncios, transferência/vistoria de responsabilidade do vendedor e outros custos efetivos.
- **A desvalorização não entra como despesa de caixa separada.** Ela é refletida no valor residual recebido ao vender. Pode aparecer como componente **explicativo**, sem somar duas vezes.
- Caso a estratégia seja **manter** o carro depois do horizonte, incluir o valor de mercado residual como patrimônio terminal, **sem fingir que houve venda**. Diferenciar “marcação a mercado” de liquidação.

### 5.3 Compra financiada

- Entrada e taxas pagas à vista entram em `FC_0`.
- Simular tabela de amortização Price ou SAC de acordo com o contrato, incluindo principal efetivamente financiado, juros, eventuais serviços financiados e vencimentos.
- Cada parcela sai de caixa no mês do pagamento. A amortização diminui o passivo; **não é perda patrimonial adicional**.
- Se houver venda no mês `N` antes do término do contrato, liquidar o **saldo devedor naquela data**, com a redução dos juros futuros implícita no saldo; não somar as parcelas ainda não vencidas.
- Financeira pode exigir custos de baixa/registro, juros proporcionais ou outros encargos contratuais; parametrizá-los explicitamente.
- Financiamento inteiramente quitado antes de `N` não gera saldo fictício na venda.
- O custo econômico é calculado do **fluxo consolidado**; juros, depreciação, taxas e custo de oportunidade aparecem no detalhamento explicativo reconciliado, sem dupla contagem.

### 5.4 Revenda e liquidez

- Valor referência após depreciação: `V_ref(N)`, como input direto ou curva por idade/meses.
- Particular: `V_particular = V_ref − descontos/despesas específicos`.
- Loja: `V_loja = V_ref × (1−descontoLoja) − despesas específicas`.
- **Desconto de loja incide sobre o valor de referência já depreciado**, não sobre o preço original; evitar aplicar desvalorização duas vezes.
- O tempo adicional para vender pode gerar custos de manutenção, juros e estacionamento e alterar o fluxo de caixa. Deve ser modelado como meses extras ou atraso de liquidação, não só como etiqueta “liquidez”.
- O desconto de venda de loja é hipótese até existir uma oferta real. Não supor uma porcentagem universal.

### 5.5 Assinatura e locação

- Mês 0: adesão, eventual primeira mensalidade antecipada e caução **reembolsável**.
- Mensalidades devidas entram nas datas reais e recebem **o mesmo tratamento de custo de oportunidade** das parcelas do financiamento.
- Encargos incluídos (seguro, IPVA, revisões etc.) não são cobrados de novo ao locatário.
- Caução reembolsada é fluxo positivo no mês da devolução; somente diferenças, penalidades ou retenções permanentes são despesa.
- Encerramento antecipado, excedente de km, limpeza/avarias e coparticipação: custos contratualmente previstos ou cenários de risco; não transformar possíveis eventos em despesas certas sem hipótese explícita.
- Assinatura anual e aluguel flexível têm prazos e disponibilidade diferentes: comparar as **coberturas de tempo de uso** e exibir alertas de não equivalência.

### 5.6 Impostos, custos e inflação

- IPVA/licenciamento devem respeitar incidência e **calendário dos pagamentos**, em vez de uma mera divisão por 12 sem identificação.
- Seguro pode ter pagamento anual ou parcelado e eventual reembolso pro-rata, se contratualmente confirmado.
- Manutenção por tempo permanece mesmo com quilometragem zero; custos por distância devem zerar com `km=0`.
- Não somar um custo de “documentação anual” genérico se IPVA, licenciamento e taxas específicas já forem separados.
- Inflação é usada para projeções/reais e reajustes nominais explicitamente configurados, **não é OPEX** e não deve ser descontada duas vezes na taxa de oportunidade.
- Os diferentes cenários devem compartilhar impostos/custos somente quando forem de fato da responsabilidade do titular da estratégia.

## 6. Relatórios e interface

### 6.1 Navegação e configuração

1. **Criar nova simulação guiada** (uma pergunta por tela, ramificações relevantes, revisão antes de aplicar, cancelar sem perda da simulação anterior).
2. **Editar premissas** por blocos recolhíveis: carro, compra, financiamento, custos, revenda, locação, macroeconomia.
3. **Comparação final** sempre visível, com recalculo automático e avisos de falta de comparabilidade.
4. **Memória de cálculo** abrível em cada componente: fonte, fórmula, valores, mês, número de parcelas pagas, saldo devedor e transações.
5. **Salvar automaticamente no navegador**, restaurar defaults, importar/exportar JSON e compartilhar preset sem informações pessoais.

### 6.2 Indicadores

- Custo econômico total, VP opcional, mensalidade econômica equivalente.
- Desembolso inicial, parcelas mensais efetivas, despesas de propriedade, desembolso líquido nominal, oportunidade de capital.
- Capital inicial necessário, pico de necessidade de caixa e saldo devedor no mês de saída.
- Patrimônio residual líquido/valor recuperado na venda; tempo disponível do carro.
- Preço de assinatura de equilíbrio (break-even) e preço mínimo de revenda que empata com a assinatura.
- Cenários conservador/base/otimista e tabela de sensibilidade de revenda × aluguel.

### 6.3 Gráficos (por etapas)

- MVP: barras comparativas de custo econômico por estratégia e fluxo mensal acumulado.
- Evolução: curva de custo/caixa mês a mês, decomposição do custo econômico e mapa de sensibilidade.
- Deixar a escala e o período explícitos (R$ nominais, R$ equivalentes no mês N ou R$ de poder de compra constante).

## 7. Preset inicial para testar o motor

**Preset de trabalho: “Rio — carro seminovo R$ 80 mil, carro parado, 12 meses”**.

| Premissa | Valor inicial | Estado |
| --- | --- | --- |
| Preço do veículo | R$ 80.000 | Exemplo |
| Entrada | R$ 16.000 (20%) | Exemplo |
| Principal antes de IOF/tarifas | R$ 64.000 | Derivado |
| Financiamento | 36 meses; Price; 1,96% a.m. | Hipótese, não cotação |
| Horizonte de saída | 12 meses | Escolhido |
| Quilometragem | 0 km/mês | Escolhido |
| Desvalorização acumulada no ano | 10% | Hipótese |
| Revenda particular | R$ 72.000 | Derivado da hipótese |
| Desconto adicional loja | 15% sobre R$ 72.000 | Hipótese; R$ 61.200 |
| IPVA | 4% a.a. sobre base editável | Referência ilustrativa RJ |
| Seguro | R$ 4.400/ano | Provisão |
| Manutenção/documentação | R$ 1.200/ano **antes de decompor taxas** | Provisão a reconciliar |
| Oportunidade financeira | 11,26% a.a., efetiva líquida | Hipótese datada |
| Assinatura | R$ 2.299/mês em 12 meses | Referência de Argo **não equivalente** ao carro de R$ 80 mil |
| Custos de transação | IOF, transferência, gravame, vistoria, banco, anúncios e baixa, um a um | Provisões editáveis; confirmar incidência |

O modelo deve **recalcular os números a partir do fluxo** e não copiar os totais de conversas anteriores como oráculo. Valores prévios podem conter arredondamento, aproximações, duplicidade de custos de documentação e diferenças entre preço de compra e carro de assinatura.

O aluguel de um Argo 0 km **não prova** que seja economicamente equivalente à compra de qualquer seminovo de R$ 80 mil. A ferramenta destacará essa diferença.

## 8. Arquitetura proposta

Tecnologias: **HTML + CSS + JavaScript vanilla**; módulos puros que possam rodar no Node (testes) e no navegador. GitHub Pages sem build nem backend na primeira versão.

```text
/
├── README.md
├── index.html
├── styles.css
├── app.js
├── guided-setup.js
├── model/
│   ├── financing.js
│   ├── vehicle-costs.js
│   ├── rental.js
│   ├── cashflows.js
│   └── scenario-engine.js
├── presets/
│   └── rio-80k-12m.json
├── tests/
│   ├── financing.test.js
│   ├── cashflows.test.js
│   ├── scenario-engine.test.js
│   └── config.test.js
├── docs/
│   ├── plano-projeto.md
│   ├── especificacao-modelo.md
│   ├── fontes-premissas.md
│   └── pendencias.md
├── AGENTS.md
├── package.json
└── .github/workflows/test.yml
```

- A interface **não pode** duplicar fórmulas financeiras ou alterar resultados por conta própria.
- Funções do motor recebem `config` explícita e devolvem fluxos, saldos, resultados e decomposição auditável.
- Estado em JSON com `schemaVersion`; migrations explícitas; rejeitar importações incompatíveis sem sobrescrever a simulação.
- Persistir em `localStorage`, com opção de limpar e exportar; não guardar CPF, proposta individual identificável, dados bancários, placas ou credenciais.
- Arredondar para apresentação, **não** em cada cálculo intermediário; reconciliar tolerâncias de centavos.
- Layout responsivo, navegação por teclado e textos explicativos para não especialistas.

## 9. Roadmap priorizado

| Fase | Prioridade | Entrega | Critérios de aceite |
| --- | --- | --- | --- |
| 0 — Fundação | P0 | Este plano, regras de desenvolvimento, backlog e especificação canônica | Escopo e hipóteses revisáveis; decisões registradas |
| 1 — Financiamento | P0 | Price/SAC, tarifas e quitação antecipada | Planilha mensal e testes: saldo, juros, parcelas, quitação |
| 2 — Motor econômico | P0 | Fluxos completos e custo de oportunidade simétrico | Compra à vista/financiada, particular/loja, assinatura; reconciliação |
| 3 — Interface MVP | P1 | Premissas editáveis, comparativo, tabela mensal, gráficos | Preset Rio recalculável sem erros; mobile utilizável |
| 4 — Estado e entrada | P1 | Presets, wizard, JSON import/export, autosave | Compatibilidade versionada, cancelamento sem perda |
| 5 — Sensibilidade | P1 | Break-evens, revenda × mensalidade, cenários | Resultados numéricos verificados por testes |
| 6 — Flexibilidade | P2 | Locação intermitente, contratos antecipados, calendários variados | Meses disponíveis e pagamento/saída identificados |
| 7 — Mercado | P2 | Comparação de propostas com referência datada; opcional import de cotações | Sem pressupor custos ou equivalência de veículos |
| 8 — Refinamentos | P2/P3 | Taxação financeira por prazo, inflação real, risco, exportação de relatórios | Extensões sem alterar resultados canônicos anteriores sem migração |

**Ordem recomendada:** desenvolver e auditar o motor **antes** da visualização e do wizard. Interfaces nunca devem esconder os fluxos subjacentes.

## 10. Testes e critérios de qualidade

### 10.1 Casos mínimos de regressão

1. **Juros zero:** parcela = principal/prazo; amortização e saldo final exatos.
2. **Price e SAC:** cada linha satisfaz juros + amortização + taxas = prestação aplicável; saldo final zero no vencimento.
3. **Venda no mês 12 de financiamento de 36 meses:** quitar saldo correto; não pagar juros dos meses 13–36.
4. **Taxa de oportunidade zero:** custo econômico = soma nominal dos fluxos líquidos.
5. **Oportunidade sobre parcelas:** encargo de oportunidade considera todos os pagamentos da compra **e** da locação.
6. **Sem dupla contagem:** depreciação e juros aparecem na explicação, mas não são cobrados novamente sobre fluxos já lançados.
7. **Variação da revenda:** aumentar preço de venda sempre reduz custo econômico, mantido o restante.
8. **Desconto da loja:** 15% sobre referência pós-desvalorização; nunca 15% sobre valor inicial por engano.
9. **Carro parado:** combustível, pneus por km e manutenção por km zeram; custos fixos permanecem.
10. **Caução:** devolução integral na data final não vira despesa, mas produz custo de oportunidade durante imobilização.
11. **Contrato de assinatura:** multa de saída e extras só entram se configurados/ativados.
12. **Fluxos recorrentes:** equivalência entre série capitalizada e mensalidade econômica equivalente.
13. **JSON:** importação/exportação idempotente, sem corromper configurações antigas.
14. **Comparabilidade:** sinalizar diferenças de prazo, disponibilidade e tipo de carro.

### 10.2 Definição de pronto

- Documentação + teste automatizado para toda mudança de regra financeira.
- Testes locais e GitHub Actions `regression` aprovados no commit do PR (quando a CI estiver configurada).
- Revisão explícita do diff e reconciliação de exemplos numéricos.
- Nenhum resultado “corrigido” na interface para casar com expectativa.
- Limites de validade e origem de defaults visíveis.
- Sem dados pessoais nos arquivos públicos.

## 11. Pendências que precisam de evidência ou decisão

- Confirmar taxas/tarifas **reais** de transferência, gravame, registro, baixa, IOF, eventual tarifa do banco e quem suporta cada custo; evitar sobreposição entre taxas.
- Definir se IOF e serviços financeiros são pagos na contratação ou financiados, conforme a proposta.
- Obter proposta de assinatura de **veículo comparável** e discriminar franquia, seguro, quilometragem, reajuste, caução, avarias e multa.
- Definir curva de desvalorização por idade/modelo; `10%` no primeiro ano é apenas hipótese.
- Decidir como representar atraso entre anunciar e vender (horizonte ampliado versus veículo substituído); no MVP, deixar claro o timing adotado.
- Confirmar calendário e base de IPVA, licenciamento e parcelas de seguro conforme o estado e a data da compra.
- Para investimento, escolher modelo inicial de **taxa líquida informada**; tributação por prazo e curva CDI ficam para refinamento.
- Especificar tratamento de venda com saldo devedor superior ao valor de venda (necessidade de aporte no mês da quitação).
- Decidir como tratar benefício não financeiro de disponibilidade, conveniência, qualidade do veículo e risco de quebra: exibir como dimensões auxiliares, **não** atribuir valor monetário sem input do usuário.

Essas pendências não bloqueiam o motor genérico: valores ausentes podem iniciar em zero **explicitamente marcados como não informados**, sem sugerir que são grátis.

## 12. Fluxo de desenvolvimento e governança

Adotar o processo já usado em `cenarios-consorcio`:

1. Abrir issue com problema, proposta, escopo e aceite.
2. Branch `feat/<issue>-nome`, `fix/<issue>-nome` ou `docs/<issue>-nome` a partir de `main`.
3. Commits pequenos com convenção Conventional Commits, referência à issue e documentação/testes na mesma entrega.
4. Abrir PR para `main`, registrar resultados, riscos, decisões e pendências.
5. Verificar CI no commit do PR, revisar diff e resolver comentários antes do merge; não fazer push direto na `main`.
6. Fechar issue **somente após entrega completa e verificável**.
7. Ativar branch ruleset/proteção na plataforma GitHub; **arquivo de configuração não é prova de que a proteção foi ativada**.

**Condição inicial:** o repositório possui apenas um README curto; a configuração de CI e regras de branch ainda precisa ser implementada. Este primeiro documento é preparado via branch/PR e **não deve ser tratado como já integrado à main** antes de confirmação do merge.

## 13. Critério de sucesso do MVP

O usuário consegue abrir a página, carregar o preset de R$ 80 mil/entrada R$ 16 mil/horizonte 12 meses/uso zero, alterar taxa, entrada, custo de locação ou preço de revenda, e visualizar sem demora:

- qual estratégia custa menos, em R$ totais e equivalente mensal;
- caixa inicial necessário e dívida para liquidar na venda;
- o detalhamento mês a mês de todas as saídas e entradas;
- o custo de oportunidade de **cada** desembolso;
- o aluguel e o valor de revenda que empatam as estratégias;
- as hipóteses não verificadas e eventuais comparações entre veículos ou períodos não equivalentes.

O resultado deve ser **reproduzível apenas com o JSON da simulação e a versão do motor**, sem depender de preços da internet ou parâmetros escondidos.

---

*Este documento fixa decisões iniciais de produto e orientação de implementação. Premissas de mercado e regras contratuais continuam sujeitas a confirmação; alterações futuras devem ser registradas no Git e refletidas nos testes e na especificação canônica.*