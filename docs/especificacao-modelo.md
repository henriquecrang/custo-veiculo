# Especificação canônica do modelo financeiro — Custo Veículo

**Status:** versão inicial para implementação. **Data:** 19/11/2026. **Issue:** #4.  
**Documento complementar:** [Plano do projeto](plano-projeto.md).

## 1. Propósito, fonte de verdade e limitações

Comparar estratégias de aquisição, financiamento, posse, revenda, assinatura e locação de veículos em condições econômicas equivalentes. Este documento determina as fórmulas e convenções que o código **DEVE** implementar. Textos e cálculos da interface não substituem o motor.

Valores de IPVA, taxas, desvalorização, preço de aluguel e juros variam no tempo e entre contratos. Todos são **parâmetros**, nunca constantes globais fixas para qualquer usuário. A fonte efetiva do contrato, quando conhecida, prevalece sobre estimativas genéricas.

## 2. Dimensões que não podem ser misturadas

- **Fluxo de caixa (FC):** entrada (+) ou saída (-) de dinheiro em um mês específico.
- **Desembolso líquido nominal (CN):** oposto da soma dos fluxos, sem atualização; pode ser negativo quando a estratégia gera ganho.
- **Custo econômico no mês terminal (CE):** valor futuro equivalente do conjunto de fluxos a uma mesma taxa de oportunidade líquida.
- **Custo de oportunidade incremental (CO):** CE menos CN, e **não** um encargo adicional aplicado posteriormente.
- **Amortização:** pagamento de principal que reduz dívida; não deve ser cobrado novamente como custo patrimonial independente.
- **Desvalorização:** redução estimada do valor de mercado entre compra e venda; representa diferença entre preço e valor recuperado, sem novo lançamento de despesa financeira.
- **Patrimônio residual:** valor de mercado do carro menos saldo de financiamento; para uma estratégia encerrada, deve existir liquidação de fato; para uma estratégia mantida, é posição marcada a mercado.
- **Liquidez e capital necessário:** entradas e saídas efetivas, pico acumulado de necessidade de caixa, eventual aporte adicional para quitar financiamento ao vender.

A interface deve mostrar CN, CE, mensalidade equivalente, CO, fluxo mensal e dívida residual separadamente. Custos categorizados (juros, desvalorização, transações) são **explicativos**, reconciliados com o fluxo total, nunca impostos sobre o motor duas vezes.

## 3. Calendário e sinais

- Horizonte N inteiro, inicialmente de 1 a 60 meses. Meses m = 0, 1, ..., N.
- m=0 representa a contratação/compra e taxas iniciais.
- Default: parcelas vencidas no final dos meses 1..T; contratos antecipados exigem agenda distinta, informada explicitamente.
- Saída de caixa sempre **negativa**; entrada sempre **positiva**, incluindo recebimento de venda e devolução de caução.
- Toda linha de evento carrega: mês, categoria, descrição, valor, estratégia, contrato/origem e eventual referência de premissa; soma de eventos por mês = FC_m.
- Pagar entrada e receber o saldo financiado como dois lançamentos não é obrigatório: compra financiada no m=0 pode registrar somente a entrada mais custos extras pagos, pois crédito e pagamento restante ao vendedor se anulam. Se registrados separadamente, devem reconciliar exatamente.
- Despesas de IPVA/seguro e transação devem refletir **o mês de pagamento**; dividir por 12 só quando é de fato uma provisão/forma de pagamento contratada.

## 4. Taxas, equivalência econômica e mensalidade

Se R é a **taxa anual efetiva líquida de oportunidade** (decimal, não porcentagem), a taxa mensal efetiva r será:

```text
r = (1+R)^(1/12) - 1
```

**Assumir R > -1**, e, na versão inicial, apenas taxas não negativas (R >= 0). Caso a aplicação financeira seja especificada com CDI, alíquota de IR e custos, a transformação para **R líquido efetivo** deve ser explícita e testada; nunca deduzir IR automaticamente por simples multiplicação cega em qualquer prazo.

Com FC_m assinado:

```text
CN = - sum(m=0..N, FC_m)
CE_N = - sum(m=0..N, FC_m * (1+r)^(N-m))
CO = CE_N - CN
VP = CE_N / (1+r)^N

FatorAnuidadeVencida(N,r) =
    N                             se r = 0
    ((1+r)^N - 1) / r             caso contrário

MensalidadeEquivalente = CE_N / FatorAnuidadeVencida(N,r)
```

**Exemplos/invariantes:**
- Se r=0, CE_N=CN.
- Fluxo único de R$ -1.000 no mês N: CE_N=1.000, CO=0.
- Fluxo único de R$ -1.000 no mês 0: CE_N=1.000(1+r)^N.
- Mensalidade uniforme de R$ 1.000 vencida nos meses 1..N: o custo equivalente mensal deve ser R$ 1.000.
- Para aluguel com mensalidade **antecipada**, não reutilizar fator de vencido sem ajustar a agenda.
- A taxa de oportunidade é **simétrica** para compra, financiamento, aluguel, taxas, seguros e reembolsos; custo de oportunidade de cada parcela é incorporado no termo individual da soma. Não somar depois "oportunidade da entrada" ou "oportunidade das parcelas".
- Se CN/CE forem negativos (ganho econômico), manter o sinal. Não truncar em zero.

## 5. Financiamento

### 5.1 Principal, juros e prazo

- Preço P, entrada E, valor principal base L = P-E, com 0 <= E <= P.
- Custos de transação pagos à vista saem em m=0, custos financiados **aumentam o principal efetivo**.
- Juros mensais contratuais i, parcelas T (inteiro T>=1). Prazos até N também são permitidos.
- Price, quando i>0:

```text
A = L*i / (1 - (1+i)^(-T))
J_m = saldo_(m-1)*i
Amort_m = A-J_m
saldo_m = saldo_(m-1)-Amort_m
```

Para i=0: A=L/T e J_m=0. Ajuste de centavos e última parcela precisam manter saldo não negativo e final nulo, com tolerância definida.

- SAC: amortização linear L/T (exceto ajuste terminal), J_m = saldo_(m-1)*i e A_m=Amort_m+J_m.
- CET de uma proposta pode ser mostrado como dado informativo/checagem; **não** deve substituir i silenciosamente ou virar despesa adicional.

### 5.2 Venda e quitação no mês N

- Por padrão, a parcela do mês N é paga antes da liquidação, se N<=T.
- Recebimento líquido de venda (+V_liq) e pagamento do saldo após a parcela N (-saldo_N) ocorrem em N; **não** cobrar juros ou parcelas de N+1..T.
- Se N>T, saldo de dívida = 0 e não há parcelas após T.
- Custos extras de quitação/baixa de gravame são eventos separados, apenas quando aplicáveis ao contrato.
- Se V_liq < saldo_N, o fluxo terminal líquido será negativo e deverá ser exibida a necessidade de aporte.
- Adiantamentos extraordinários/amortização extra só quando configurados; não incluí-los implicitamente.

## 6. Compra à vista/financiada e revenda

### 6.1 Compra à vista

- m=0: FC = -P - custos iniciais de aquisição.
- m=1..N: despesas de manutenção de propriedade nos meses respectivos.
- m=N: FC += preço **líquido** efetivo de venda, subtraídas despesas de transação da saída.
- Não lançar depreciação em FC; ela é refletida na diferença entre P e receita de revenda.
- Se não vender, apenas marcar o valor residual como patrimônio terminal (diferente de receita de venda).

### 6.2 Compra financiada

- m=0: FC = -E - custos iniciais não financiados.
- m=1..min(T,N): parcelas de financiamento como saídas, respeitando calendário.
- m=N: receita líquida de venda - saldo devedor a quitar - custos terminais.
- **Na comparação econômica consolidada**, pagamento de juros, amortização e entrada fazem parte dos fluxos de caixa. Não adicionar principal amortizado novamente como despesa ao calcular CE.

### 6.3 Valor residual e venda

O usuário pode fornecer diretamente V_ref(N) ou a taxa acumulada de depreciação d(N):

```text
V_ref(N) = P*(1-d(N))
V_particular = V_ref(N) - descontos e custos da venda particular
V_loja = V_ref(N)*(1-h) - custos específicos da loja
```

- h é o desconto adicional de loja **sobre o valor já depreciado**; é hipótese editável e não regra universal.
- A decomposição deve deixar claro se custos da venda foram abatidos no valor líquido ou lançados separadamente: **não em ambos**.
- Atraso para anunciar/vender exige meses adicionais e não pode ser camuflado como venda instantânea.
- A venda no mesmo N em ambos os cenários é a hipótese inicial. Prazos de venda diferentes são evolução explícita.

## 7. Propriedade, km=0 e custos de transação

- Mesmo com km=0 permanecem: depreciação por idade, seguro, IPVA, licenciamento, garagem, manutenção preventiva por tempo, juros, custo de oportunidade.
- Com km=0, custos variáveis por distância (combustível, manutenção por km, pneus/km etc.) devem ser zero.
- IPVA tem base de cálculo, alíquota, incidência e mês de pagamento configuráveis. Seguro pode ser anual ou parcelado e pode ter restituição em certos contratos.
- Transferência, licenciamento, vistoria cautelar, registro, gravame e baixa de gravame são itens distintos; a categoria genérica "documentação" não pode duplicá-los.
- Custos da locadora já cobertos por mensalidade não devem ser cobrados novamente como custo de posse do locatário.
- IOF não é taxa única universal sobre o principal; será módulo próprio com base legal/contratual explícita e opção de entrada manual até calibração.

## 8. Assinatura e aluguel

- Modalidade com preço mensal, calendário de pagamento, adesão, caução reembolsável, reajuste, itens inclusos e taxas contingentes.
- m=0 pode incluir taxa de adesão, caução, e primeira parcela **apenas se antecipada**.
- Cada mensalidade efetivamente devida é FC negativo no mês correspondente.
- Caução é saída no depósito e entrada na restituição. Seu principal retorna ao usuário, mas **o custo de oportunidade de ficar imobilizada permanece**.
- Multa de rescisão, franquia, avarias, excedente de km, limpeza e retenções serão eventos certos somente se contrato ou hipótese de cenário disserem que ocorrerão.
- A comparação deve avisar quando modelos de carro, prazos ou meses de disponibilidade forem diferentes. Não converter “alugar seis meses” em “carro disponível 12 meses”.

## 9. Equilíbrio e sensibilidade

Break-even de assinatura: encontrar a mensalidade nominal que produz CE_N igual ao custo de compra, preservando os encargos fixos, calendário e taxa de oportunidade. Para pagamentos mensais vencidos idênticos, resolver com o fator de anuidade vencida; para antecipados, usar sua própria agenda.

Break-even de revenda: encontrar o preço líquido terminal de veículo que produz CE_N igual ao aluguel. Como a venda ocorre em N, variação de R$ 1 no valor líquido reduz CE_N em R$ 1, quando não altera os demais fluxos.

Exibir “sem solução” quando restrições ou preços não permitirem empate. Simular variações de desvalorização, taxa de oportunidade e aluguel com o **mesmo motor**, não fórmulas independentes.

## 10. Auditoria numérica, arredondamento e testes

- Guardar precisão numérica de cálculo em ponto flutuante com tolerâncias especificadas, arredondando principalmente na interface; para reconciliação contábil de prestação em centavos, aplicar regra consistente e teste independente.
- Nenhum número mostrado como “custo total” pode usar valores copiados da conversa como constantes.
- Testar cenários de R=0, i=0, T<N, T>N, venda negativa, caução, aluguel antecipado, h=0, depreciação zero e km=0.
- Teste de **monotonicidade**: aumentar receita de revenda, mantendo parâmetros, diminui CE na mesma proporção terminal.
- Comparar decomposição de eventos com o total CE; fluxo terminal e amortização com saldo reportado.
- JSON de entrada + versão do motor devem reproduzir sempre o mesmo cálculo em ambiente offline.

## 11. Preset inicial e evidências

Caso base: preço R$ 80 mil; entrada R$ 16 mil (20%); financiamento Price de R$ 64 mil em 36 meses a 1,96% a.m.; venda ao fim de 12 meses; km=0; revenda particular R$ 72 mil; revenda loja R$ 61,2 mil; oportunidade financeira efetiva líquida hipotética de 11,26% a.a.; seguro estimado R$ 4,4 mil/ano. IPVA de exemplo 4% sobre base informada; demais taxas/tarifas **exigem validação de incidência para não somar duas vezes**.

Esse preset não corresponde necessariamente ao carro efetivo de qualquer assinatura anunciada. Comparações com Argo ou outra classe devem alertar para não equivalência. O objetivo inicial é validar uma estrutura financeira, **não** garantir preços ou rentabilidades de mercado.

## 12. Governança e precedência

1. Contrato e normas aplicáveis, quando confirmados.
2. Especificação financeira e casos de teste.
3. Premissas de mercado com fonte/data.
4. Texto/labels da interface.

Alterações nas regras devem atualizar este documento e testes no mesmo PR; dúvidas contratuais devem permanecer marcadas como pendências, não convertidas em certezas. Ver [workflow](workflow-desenvolvimento.md).
