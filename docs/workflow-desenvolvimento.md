# Workflow de desenvolvimento

Adotamos o fluxo de [cenarios-consorcio](https://github.com/henriquecrang/cenarios-consorcio), adaptado à aplicação Custo Veículo.

1. Ler [plano](plano-projeto.md), especificação canônica (quando existir) e a issue.
2. Abrir branch a partir de `main`, sem commits diretos nessa branch principal.
3. Fazer commits pequenos, testáveis e rastreáveis, com testes e docs correspondentes.
4. Abrir PR com escopo, dependências, resultados de testes, riscos e status das hipóteses financeiras.
5. Executar `npm test` e confirmar a conclusão **success** do job GitHub Actions `regression` no head do PR.
6. Revisar diff e discussões. Após testes e revisão, merge; fechar issue só quando todos os critérios estiverem cumpridos.
7. Para mudança incompleta, manter PR/issue abertos e registrar o que falta.

## Proteger a main

Configuração necessária na interface GitHub: **Settings → Rules → Rulesets → New branch ruleset**. Apontar para a branch padrão `main`, exigir PR antes de merge e o status check `regression`; bloquear force-push e exclusão se possível. A proteção não se ativa apenas com documentação. Se a integração não disponibilizar essa ação administrativa, deixar pendência em #3 e registrar o bloqueio.

## CI

Workflow `.github/workflows/test.yml`: Node 22, `npm test`. O script usa `node --test` nativo, sem dependências. Regras matemáticas futuras devem entrar em testes unitários e de integração. Testes manuais no navegador são adicionais e devem ser relatados como executados somente quando realmente houver verificação em navegador.

## Princípio econômico

Toda estratégia deve entregar uma lista tipada de fluxos assinados (entrada positiva; gasto negativo) com datas e categorias. Os cálculos de custo futuro equivalente usam *a mesma* taxa de oportunidade em todos os cenários; não somar custos já representados pelos fluxos (como desvalorização separada da revenda).
