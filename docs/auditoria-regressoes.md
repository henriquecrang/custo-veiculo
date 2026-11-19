# Auditoria de regressões financeiras — Issue #13

Cobertura inicial independente de interface:

- **Caso numérico de referência:** R$ 80 mil, entrada R$ 16 mil, Price 36×1,96% a.m., venda no mês 12 por R$ 72 mil. Sem despesas de posse/transação ou oportunidade, compra à vista custa R$ 8 mil; com financiamento custa R$ 21.338,61 (R$ 8 mil de desvalorização e R$ 13.338,61 de juros efetivamente incorridos). A revenda para loja por R$ 61,2 mil adiciona R$ 10,8 mil de perda.
- **Oportunidade:** cada evento financeiro é capitalizado até o mês N. Mensalidade constante vencida de uma locação deve reproduzir seu preço contratual no equivalente mensal.
- **Conservação:** o total calculado é a soma dos eventos; depreciação não vira saída de caixa adicional. CET/IOF nunca são automaticamente tratados como fatos contratuais quando são estimados.
- **Amortização:** Price/SAC amortizam integralmente o saldo no vencimento, salvo quando a venda antecipa a quitação.
- **Limites:** inclui casos de entrada de 0% a 100%, horizontes 6/12/24 meses, taxas 0/0,5/1,96% a.m. e valor residual insuficiente para cobrir a dívida.
- **Uso nulo:** km zero zera despesa por rodagem, mas preserva impostos/seguro/manutenção por tempo.
- **Monotonicidade:** R$ 1 a mais na revenda terminal reduz custo econômico em R$ 1, mantendo as demais premissas.
- **Sinais:** ganho líquido pode produzir custo negativo.

Todos os exemplos numéricos de mercado são **hipóteses**, não cotações. A CI automatizada não substitui verificação do navegador (issue #25).

Comando: `npm test` (Node 22). Ações em PR exigem confirmação do job `regression` para o head verificado.
